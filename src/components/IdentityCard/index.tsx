import { socialLinks } from '../../lib/content';
import { getImageUrl } from '../../lib/images';

export default function IdentityCard() {
  return (
    <div className="identity-card">
      <div className="identity-card-content">
        <div className="identity-name"><span className="identity-initial">J</span>eremy <span className="identity-initial">L</span>iu</div>
        <div className="identity-links">
          {socialLinks.slice(0, 4).map(link => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith('mailto') ? undefined : '_blank'}
              rel="noopener noreferrer"
              title={link.label}
            >
              <img src={getImageUrl(link.icon) || ''} alt={link.label} style={{ width: 14, height: 14 }} />
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
