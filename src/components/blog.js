// Blog window component - Cloned from projects.js and modified for blog structure
// Imports from main.js
import { getImageUrl, content, applyColorPalette } from "../main.js";

// Helper function to create category card HTML (for main tab)
export function createCategoryHTML(category, categoryKey) {
  const imgUrl = category.image ? getImageUrl(category.image) : null;

  let html = `
    <div class="blog-category-card">
      <div class="blog-category-card-content">
        <h3 class="blog-category-card-title">${category.name}</h3>`;

  // Add image if it exists
  if (imgUrl) {
    html += `<img src="${imgUrl}" class="blog-category-image" alt="${category.name}">`;
  }

  html += `
        <p class="blog-category-card-description">${category.description}</p>
        <button class="blog-see-more-btn social-btn" data-category="${categoryKey}" style="width: 140px; margin-top: 8px;">
          <img src="${getImageUrl("all-icon") || ""}" alt="See More"> See More
        </button>
      </div>
    </div>`;

  return html;
}

// Helper function to create blog post HTML (for category tabs)
export function createBlogPostHTML(post, postIndex, categoryKey) {
  // Handle images (same logic as old blog.js)
  let images = [];
  if (post.image) {
    if (Array.isArray(post.image)) {
      images = post.image
        .map((imgData) => {
          let imgName,
            size = "medium",
            width = null,
            height = null;

          if (typeof imgData === "string") {
            imgName = imgData;
          } else if (imgData && imgData.filename) {
            imgName = imgData.filename;
            if (imgData.size) {
              size = imgData.size;
            } else if (imgData.width !== undefined) {
              width =
                typeof imgData.width === "number"
                  ? `${imgData.width}px`
                  : imgData.width;
              size = "custom";
            }
            if (imgData.height !== undefined) {
              height =
                typeof imgData.height === "number"
                  ? `${imgData.height}px`
                  : imgData.height;
            }
          } else {
            return null;
          }

          const url = getImageUrl(imgName);
          return url ? { url, alt: imgName, size, width, height } : null;
        })
        .filter((img) => img !== null);
    } else {
      const url = getImageUrl(post.image);
      if (url) {
        images = [{ url, alt: post.image, size: "medium" }];
      }
    }
  }

  // Generate images HTML
  const imagesHTML =
    images.length > 0
      ? `
        <div class="blog-post-images">
          ${images
            .map((img) => {
              let style = "";
              if (img.size === "custom" && img.width) {
                style = `style="width: ${img.width};`;
                if (img.height) {
                  style += ` height: ${img.height};`;
                }
                style += `"`;
              }
              const sizeClass =
                img.size === "custom" ? "" : ` blog-post-image-${img.size}`;
              return `<img src="${img.url}" alt="${img.alt}" class="blog-post-image${sizeClass}" ${style}>`;
            })
            .join("")}
        </div>
      `
      : "";

  // Get category posts for navigation
  const categoryPosts = content.blogCategories[categoryKey]?.posts || [];
  const hasNext = postIndex < categoryPosts.length - 1;
  const hasPrevious = postIndex > 0;

  let html = `
    <div class="blog-post-single">
      <h1 class="blog-post-single-title">${post.title}</h1>
      <p class="blog-post-single-date">${post.date}</p>
      ${imagesHTML}
      <div class="blog-post-single-text">
        ${post.text}
      </div>
      
      <!-- Navigation buttons -->
      <div class="blog-post-navigation">
        ${hasPrevious ? `
          <button class="blog-nav-btn social-btn blog-prev-btn" data-category="${categoryKey}" data-post-index="${postIndex - 1}" style="width: 140px;">
            <img src="${getImageUrl("all-icon") || ""}" alt="Previous"> Previous
          </button>
        ` : ""}
        <button class="blog-nav-btn social-btn blog-main-btn" data-category="${categoryKey}" style="width: 140px;">
          <img src="${getImageUrl("all-icon") || ""}" alt="Main"> Main
        </button>
        ${hasNext ? `
          <button class="blog-nav-btn social-btn blog-next-btn" data-category="${categoryKey}" data-post-index="${postIndex + 1}" style="width: 140px;">
            <img src="${getImageUrl("all-icon") || ""}" alt="Next"> Next
          </button>
        ` : ""}
      </div>
    </div>`;

  return html;
}

// Function to show a specific blog post within a category
function showBlogPost(categoryKey, postIndex) {
  const category = content.blogCategories[categoryKey];
  if (!category || !category.posts || !category.posts[postIndex]) return;

  const post = category.posts[postIndex];
  const pane = document.querySelector(
    `.tab-pane[data-tab-content="${categoryKey}"]`
  );
  if (pane) {
    pane.innerHTML = createBlogPostHTML(post, postIndex, categoryKey);
    
    // Re-attach event listeners for navigation buttons
    setTimeout(() => {
      const prevBtn = pane.querySelector(".blog-prev-btn");
      const mainBtn = pane.querySelector(".blog-main-btn");
      const nextBtn = pane.querySelector(".blog-next-btn");

      if (prevBtn) {
        prevBtn.addEventListener("click", (e) => {
          e.preventDefault();
          showBlogPost(categoryKey, postIndex - 1);
        });
      }

      if (mainBtn) {
        mainBtn.addEventListener("click", (e) => {
          e.preventDefault();
          const blogTabs = document.querySelectorAll(".blog-tab");
          const tabPanes = document.querySelectorAll(".tab-pane");
          blogTabs.forEach((t) => {
            t.classList.remove("active");
            t.style.background = "#c0c0c0";
            t.style.border = "none";
            t.style.borderRight = "1px solid #808080";
          });
          tabPanes.forEach((p) => {
            p.classList.remove("active");
            p.style.display = "none";
          });
          const mainTab = document.querySelector('.blog-tab[data-tab="main"]');
          const mainPane = document.querySelector(
            '.tab-pane[data-tab-content="main"]'
          );
          if (mainTab) {
            mainTab.classList.add("active");
            mainTab.style.background = "#c0c0c0";
            mainTab.style.border = "none";
          }
          if (mainPane) {
            mainPane.classList.add("active");
            mainPane.style.display = "block";
          }
        });
      }

      if (nextBtn) {
        nextBtn.addEventListener("click", (e) => {
          e.preventDefault();
          showBlogPost(categoryKey, postIndex + 1);
        });
      }
    }, 10);
  }
}

// Function to generate blog window HTML
export function generateBlogWindowHTML(categoriesHTML) {
  return `
      <!-- Blog Window -->
      <win98-window title="Blog.exe" resizable show-minimize class="window-blog">
        <div class="window-body">
          <!-- Tabs -->
          <div class="blog-tabs">
            <button class="blog-tab active" data-tab="main">
              Main
            </button>
            ${Object.keys(content.blogCategories || {})
              .map(
                (categoryKey) => `
              <button class="blog-tab" data-tab="${categoryKey}">
                ${content.blogCategories[categoryKey]?.name || categoryKey}
              </button>
            `
              )
              .join("")}
          </div>
          
          <!-- Tab Content -->
          <div class="blog-tab-content">
            <!-- Main Tab (default) -->
            <div class="tab-pane active" data-tab-content="main">
              <h2 id="blog-main-title" class="animate-title-fast" style="margin-top: 0; margin-bottom: 5px; min-height: 1.2em; visibility: hidden;">My Blog</h2>
              ${categoriesHTML}
            </div>
            
            <!-- Individual Category Tabs -->
            ${Object.keys(content.blogCategories || {})
              .map(
                (categoryKey) => {
                  const category = content.blogCategories[categoryKey];
                  const posts = category?.posts || [];
                  return `
                <div class="tab-pane" data-tab-content="${categoryKey}" style="display: none;">
                  ${posts.length > 0 ? createBlogPostHTML(posts[0], 0, categoryKey) : `<p>No posts yet in ${category.name}.</p>`}
                </div>
              `;
                }
              )
              .join("")}
          </div>
        </div>
      </win98-window>
    `;
}

// Function to initialize blog tabs (event listeners and tab switching)
export function initBlogTabs() {
  setTimeout(() => {
    const blogTabs = document.querySelectorAll(".blog-tab");
    const tabPanes = document.querySelectorAll(".tab-pane");
    const tabsContainer = document.querySelector(".blog-tabs");

    // Enable horizontal scrolling via mouse wheel
    if (tabsContainer) {
      tabsContainer.addEventListener(
        "wheel",
        (e) => {
          if (Math.abs(e.deltaY) > 0) {
            e.preventDefault();
            tabsContainer.scrollLeft += e.deltaY;
          }
        },
        { passive: false }
      );
    }

    // Initialize active tab styling
    blogTabs.forEach((tab) => {
      if (!tab.classList.contains("active")) {
        tab.style.border = "none";
        tab.style.borderRight = "1px solid #808080";
      }
    });

    // Function to switch tabs
    const switchTab = (tabId) => {
      // Remove active class from all tabs and panes
      blogTabs.forEach((t) => {
        t.classList.remove("active");
        t.style.background = "#c0c0c0";
        t.style.border = "none";
        t.style.borderRight = "1px solid #808080";
      });
      tabPanes.forEach((p) => {
        p.classList.remove("active");
        p.style.display = "none";
      });

      // Find and activate the target tab
      const targetTab = document.querySelector(
        `.blog-tab[data-tab="${tabId}"]`
      );
      if (targetTab) {
        targetTab.classList.add("active");
        targetTab.style.background = "#c0c0c0";
        targetTab.style.border = "none";
      }

      const activePane = document.querySelector(
        `.tab-pane[data-tab-content="${tabId}"]`
      );
      if (activePane) {
        activePane.classList.add("active");
        activePane.style.display = "block";
      }

      // Reapply theme colors after tab switch
      setTimeout(() => {
        const savedPalette = localStorage.getItem("colorPalette");
        if (savedPalette && savedPalette !== "default") {
          const savedPaletteColors = localStorage.getItem("paletteColors");
          if (savedPaletteColors) {
            try {
              const colors = JSON.parse(savedPaletteColors);
              document
                .querySelectorAll(
                  "button, .social-btn, .blog-nav-btn, .blog-see-more-btn"
                )
                .forEach((btn) => {
                  btn.style.backgroundColor = colors[0] || "#c0c0c0";
                  btn.style.color = colors[3] || "#ffffff";
                });
            } catch (e) {
              console.warn("Failed to reapply theme:", e);
            }
          }
        } else {
          document
            .querySelectorAll(
              "button, .social-btn, .blog-nav-btn, .blog-see-more-btn"
            )
            .forEach((btn) => {
              btn.style.backgroundColor = "#c0c0c0";
              btn.style.color = "#000000";
            });
        }
      }, 10);
    };

    // Handle tab clicks
    blogTabs.forEach((tab) => {
      tab.addEventListener("click", () => {
        const tabId = tab.getAttribute("data-tab");
        switchTab(tabId);
      });
    });

    // Handle "See More" button clicks in Main tab
    document.querySelectorAll(".blog-see-more-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const categoryKey = btn.getAttribute("data-category");
        switchTab(categoryKey);
      });
    });

    // Handle navigation buttons (Previous, Main, Next)
    document.querySelectorAll(".blog-prev-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const categoryKey = btn.getAttribute("data-category");
        const postIndex = parseInt(btn.getAttribute("data-post-index"));
        showBlogPost(categoryKey, postIndex);
      });
    });

    document.querySelectorAll(".blog-main-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        switchTab("main");
      });
    });

    document.querySelectorAll(".blog-next-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.preventDefault();
        const categoryKey = btn.getAttribute("data-category");
        const postIndex = parseInt(btn.getAttribute("data-post-index"));
        showBlogPost(categoryKey, postIndex);
      });
    });
  }, 100);
}


// Function to open blog window
export function openBlogWindow() {
  let blogWindow = document.querySelector('win98-window[title="Blog.exe"]');

  if (!blogWindow) {
    // Build categories HTML for main tab
    const categories = content.blogCategories || {};
    const categoryKeys = Object.keys(categories);
    const categoriesHTML = categoryKeys
      .map((key) => createCategoryHTML(categories[key], key))
      .join("");

    const windowHTML = generateBlogWindowHTML(categoriesHTML);

    const desktop = document.querySelector("win98-desktop");
    if (desktop) {
      desktop.insertAdjacentHTML("beforeend", windowHTML);
      blogWindow = document.querySelector('win98-window[title="Blog.exe"]');

      if (blogWindow) {
        // Position window to the right of blog icon and a bit lower
        blogWindow.style.top = "150px";
        blogWindow.style.left = "120px";
        blogWindow.classList.add("window-pop-open");
        // Apply current theme
        const savedPalette =
          localStorage.getItem("colorPalette") || "default";
        applyColorPalette(savedPalette);

        // Initialize blog tabs after window is created
        setTimeout(() => {
          initBlogTabs();
          // Trigger typing animation
          const triggerTypingAnimation = (selectors) => {
            selectors.forEach((selector) => {
              const element = document.querySelector(selector);
              if (element) {
                element.style.visibility = "hidden";
                const text = element.textContent;
                element.textContent = "";
                element.style.visibility = "visible";
                // Simple typing animation
                let i = 0;
                const typeInterval = setInterval(() => {
                  if (i < text.length) {
                    element.textContent += text[i];
                    i++;
                  } else {
                    clearInterval(typeInterval);
                  }
                }, 30);
              }
            });
          };
          triggerTypingAnimation(["#blog-main-title"]);
        }, 100);
      }
    }
  }

  if (blogWindow) {
    // Position window to the right of blog icon and a bit lower (if not already positioned)
    if (!blogWindow.style.top || blogWindow.style.top === "auto") {
      blogWindow.style.top = "150px";
    }
    if (!blogWindow.style.left || blogWindow.style.left === "auto") {
      blogWindow.style.left = "120px";
    }
    // Bring window to front
    const allWindows = document.querySelectorAll("win98-window");
    let maxZ = 0;
    allWindows.forEach((w) => {
      const z = parseInt(w.style.zIndex) || 0;
      if (z > maxZ) maxZ = z;
    });
    blogWindow.style.zIndex = (maxZ + 1).toString();
    blogWindow.style.display = "block";
    blogWindow.style.visibility = "visible";
    blogWindow.classList.add("window-pop-open");
  }
}
