import { MenuBrowser } from "@/components/menu/menu-browser";
import { instagramHandle, whatsappUrl } from "@/lib/menu/format";
import { buildPublicSections } from "@/lib/menu/public-view";
import { readPublicMenu } from "@/lib/server/menu-store";
import { AuthRedirect } from "./auth-redirect";

// Static page regenerated in the background (ISR). Saving from the admin panel also
// revalidates it immediately, so this interval is only a safety net.
export const revalidate = 300;

function WhatsAppIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon">
      <path d="M12 2.5a9.5 9.5 0 0 0-8.2 14.3L2.5 21.5l4.8-1.3A9.5 9.5 0 1 0 12 2.5zm0 17.3a7.8 7.8 0 0 1-4-1.1l-.3-.2-2.8.8.8-2.7-.2-.3A7.8 7.8 0 1 1 12 19.8zm4.3-5.8c-.2-.1-1.4-.7-1.6-.8s-.4-.1-.5.1-.6.8-.8 1-.3.2-.5.1a6.4 6.4 0 0 1-3.2-2.8c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.7-1.7c-.2-.5-.4-.4-.5-.4h-.5a.9.9 0 0 0-.6.3 2.7 2.7 0 0 0-.9 2 4.7 4.7 0 0 0 1 2.5 10.8 10.8 0 0 0 4.1 3.6c1.5.7 2.1.7 2.9.6a2.4 2.4 0 0 0 1.6-1.1 2 2 0 0 0 .1-1.1c0-.1-.2-.2-.4-.3z" fill="currentColor" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="icon" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4.2" />
      <circle cx="17.4" cy="6.6" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export default async function Home() {
  const menu = await readPublicMenu();
  const { business } = menu;
  const sections = buildPublicSections(menu);
  const whatsapp = whatsappUrl(business.whatsappNumber);
  const handle = instagramHandle(business.instagramUrl);
  const notices = { alcohol: business.alcoholNotice, salt: business.saltNotice };
  const legal = [business.alcoholNotice, business.saltNotice].filter(Boolean);

  return (
    <>
      <AuthRedirect />
      <header className="hero">
        <div className="hero-inner">
          <h1 className="logo">
            <span className="logo-name">{business.name}</span>
            {business.subtitle && <span className="logo-sub">{business.subtitle}</span>}
          </h1>
          {business.description && <p className="hero-desc">{business.description}</p>}
          {(business.address || business.hours) && (
            <dl className="hero-info">
              {business.address && <div><dt>Dirección</dt><dd>{business.address}</dd></div>}
              {business.hours && <div><dt>Horarios</dt><dd>{business.hours}</dd></div>}
            </dl>
          )}
          {(whatsapp || business.instagramUrl) && (
            <div className="hero-actions">
              {whatsapp && <a className="pill pill-green" href={whatsapp} target="_blank" rel="noopener noreferrer"><WhatsAppIcon /> WhatsApp</a>}
              {business.instagramUrl && <a className="pill" href={business.instagramUrl} target="_blank" rel="noopener noreferrer"><InstagramIcon /> Instagram</a>}
            </div>
          )}
        </div>
      </header>

      <main id="carta">
        <MenuBrowser sections={sections} notices={notices} />
      </main>

      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <p className="logo logo-small"><span className="logo-name">{business.name}</span>{business.subtitle && <span className="logo-sub">{business.subtitle}</span>}</p>
          </div>
          <div className="footer-contact">
            {business.closingTitle && <h2 className="footer-title">{business.closingTitle}</h2>}
            {business.closingText && <p className="footer-text">{business.closingText}</p>}
            <div className="footer-actions">
              {whatsapp && (
                <a className="pill pill-green" href={whatsapp} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon /> Escribinos{business.whatsappDisplay ? ` · ${business.whatsappDisplay}` : ""}
                </a>
              )}
              {business.instagramUrl && (
                <a className="pill" href={business.instagramUrl} target="_blank" rel="noopener noreferrer">
                  <InstagramIcon /> {handle || "Instagram"}
                </a>
              )}
            </div>
            {(business.address || business.hours) && (
              <dl className="footer-info">
                {business.address && <div><dt>Dirección</dt><dd>{business.address}</dd></div>}
                {business.hours && <div><dt>Horarios</dt><dd>{business.hours}</dd></div>}
              </dl>
            )}
          </div>
        </div>
        {legal.length > 0 && (
          <div className="footer-legal">{legal.map(text => <p key={text}>{text}</p>)}</div>
        )}
        <p className="footer-credit">
          Desarrollado por{" "}
          <a
            href="https://digivisual.online/"
            target="_blank"
            rel="noopener noreferrer"
          >
            DigiVisual
          </a>
          {" "}(
          <a
            href="https://www.instagram.com/_digivisual/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Instagram
          </a>
          )
        </p>
      </footer>
    </>
  );
}
