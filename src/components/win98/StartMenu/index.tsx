import React from 'react';

interface MenuItem {
  id: string;
  emoji: string;
  label: string;
  onClick: () => void;
  separator?: boolean;
}

interface StartMenuProps {
  items: MenuItem[];
  visible: boolean;
  onClose: () => void;
}

export default function StartMenu({ items, visible, onClose }: StartMenuProps) {
  if (!visible) return null;

  return (
    <>
      {/* Backdrop to close menu */}
      <div
        style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', zIndex: 9999 }}
        onClick={onClose}
      />
      <div
        className="window"
        style={{
          position: 'fixed',
          bottom: 40,
          left: 10,
          width: 200,
          zIndex: 10000,
          boxShadow: '2px -2px 5px rgba(0, 0, 0, 0.3)',
          border: '2px solid #808080',
        }}
      >
        <div className="title-bar">
          <div className="title-bar-text">Start Menu</div>
        </div>
        <div className="window-body" style={{ border: '2px solid #808080', paddingBottom: 8 }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {items.map((item) => (
              <React.Fragment key={item.id}>
                {item.separator && <hr style={{ margin: '4px 0' }} />}
                <li
                  onClick={() => {
                    onClose();
                    item.onClick();
                  }}
                  style={{
                    padding: '4px 8px',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  onMouseEnter={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = '#000080';
                    (e.target as HTMLElement).style.color = '#fff';
                  }}
                  onMouseLeave={(e) => {
                    (e.target as HTMLElement).style.backgroundColor = 'transparent';
                    (e.target as HTMLElement).style.color = 'inherit';
                  }}
                >
                  {item.emoji} {item.label}
                </li>
              </React.Fragment>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}
