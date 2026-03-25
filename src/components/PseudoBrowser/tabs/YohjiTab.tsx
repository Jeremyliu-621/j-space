export default function YohjiTab() {
  return (
    <div className="yohji-lookbook">
      {/* Opening — full bleed image */}
      <div className="yohji-bleed">
        <div className="yohji-img-placeholder yohji-img-tall">
          IMAGE: oversized black coat, studio shot — FW24
        </div>
      </div>

      {/* Typographic interruption 1 */}
      <div className="yohji-type yohji-type-left">
        <span>ANTI-</span>
        <span>MAINSTREAM</span>
      </div>

      {/* Split section — image left (60), text right (40) */}
      <div className="yohji-split">
        <div className="yohji-split-img">
          <div className="yohji-img-placeholder">
            IMAGE: deconstructed blazer detail — raw seam, exposed lining
          </div>
        </div>
        <div className="yohji-split-text">
          <p>The garment is not finished. It is abandoned at the right moment. The sleeve is longer than it should be. The hem is not where you expect it.</p>
          <p>This is not a mistake.</p>
        </div>
      </div>

      {/* Full bleed 2 */}
      <div className="yohji-bleed">
        <div className="yohji-img-placeholder yohji-img-wide">
          IMAGE: runway moment — group walk, all black, Yohji FW23
        </div>
      </div>

      {/* Type 2 — huge, right-aligned, cropped */}
      <div className="yohji-type yohji-type-right">
        DECONSTRUCTION
      </div>

      {/* Split section — reversed: text left (40), image right (60) */}
      <div className="yohji-split yohji-split-reverse">
        <div className="yohji-split-text">
          <p>Wabi-sabi is the acceptance of transience and imperfection. A thread pulls. The dye is uneven. The silhouette is not symmetrical.</p>
          <p>It is more honest than perfection.</p>
        </div>
        <div className="yohji-split-img">
          <div className="yohji-img-placeholder">
            IMAGE: draped asymmetric dress — wrinkled linen, natural light
          </div>
        </div>
      </div>

      {/* Type 3 */}
      <div className="yohji-type yohji-type-center">
        WABI-SABI
      </div>

      {/* Full bleed 3 */}
      <div className="yohji-bleed">
        <div className="yohji-img-placeholder yohji-img-tall">
          IMAGE: backstage portrait — model in oversized trousers, cigarette, Paris
        </div>
      </div>

      {/* Type 4 — offset, partially cropped */}
      <div className="yohji-type yohji-type-overflow">
        DARKNESS
      </div>

      {/* Split 3 */}
      <div className="yohji-split">
        <div className="yohji-split-img">
          <div className="yohji-img-placeholder">
            IMAGE: flat lay — layered black fabrics, different textures and weights
          </div>
        </div>
        <div className="yohji-split-text">
          <p>Intentionality is choosing black not because it is easy but because it contains everything. Every decision — the weight of a fabric, the fall of a pleat, the absence of a button — is deliberate.</p>
        </div>
      </div>

      {/* Type 5 — final */}
      <div className="yohji-type yohji-type-left yohji-type-final">
        INTENTIONALITY
      </div>

      {/* Closing image */}
      <div className="yohji-bleed yohji-bleed-close">
        <div className="yohji-img-placeholder yohji-img-wide">
          IMAGE: empty atelier — cutting table, scissors, black fabric rolls
        </div>
      </div>
    </div>
  );
}
