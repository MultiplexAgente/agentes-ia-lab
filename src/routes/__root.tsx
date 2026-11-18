import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "HUG — Gestão Empresarial Integrada" },
      { name: "description", content: "HUG — Plataforma integrada de gestão empresarial, PDV, estoque e inteligência comercial." },
      { name: "author", content: "HUG" },
      { property: "og:title", content: "HUG — Gestão Empresarial Integrada" },
      { property: "og:description", content: "HUG — Vendas, estoque, gestão empresarial e inteligência comercial integrados em uma única plataforma." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;450;500;600&display=swap",
      },
      { rel: "icon", href: "/favicon.ico" },
      { rel: "icon", href: "/images/hug-icon.jpg", type: "image/jpeg" },
      { rel: "apple-touch-icon", href: "/images/hug-icon.jpg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <HeadContent />
        <style
          dangerouslySetInnerHTML={{
            __html: `
              #lovable-badge,
              [id*="lovable" i],
              [class*="lovable" i],
              [data-lovable],
              [data-lovable-badge],
              a[href*="lovable"],
              iframe[src*="lovable"],
              div:has(> a[href*="lovable"]),
              div:has(> button[aria-label*="lovable" i]),
              body > div[style*="fixed"][style*="bottom"] {
                display: none !important;
                visibility: hidden !important;
                opacity: 0 !important;
                pointer-events: none !important;
                width: 0 !important;
                height: 0 !important;
                position: absolute !important;
                left: -99999px !important;
                top: -99999px !important;
                z-index: -99999 !important;
              }
            `,
          }}
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){
              function kill(){
                try{
                  var b=document.querySelectorAll('#lovable-badge,[id*="lovable" i],[class*="lovable" i],[data-lovable],[data-lovable-badge],a[href*="lovable"],iframe[src*="lovable"]');
                  for(var i=0;i<b.length;i++){
                    b[i].style.setProperty('display','none','important');
                    b[i].remove();
                  }
                  var all=document.querySelectorAll('div,a,button,span,aside,footer');
                  for(var j=0;j<all.length;j++){
                    var el=all[j];
                    var txt=(el.innerText||el.textContent||'').trim();
                    if(txt.indexOf('Edit with')!==-1&&txt.indexOf('Lovable')!==-1){
                      var p=el;
                      while(p&&p!==document.body){
                        var st=window.getComputedStyle(p);
                        if(st.position==='fixed'||st.position==='absolute'){
                          p.style.setProperty('display','none','important');
                          p.remove();
                          break;
                        }
                        p=p.parentElement;
                      }
                      el.style.setProperty('display','none','important');
                      el.remove();
                    }
                  }
                }catch(e){}
              }
              if(typeof window!=='undefined'){
                kill();
                if(document.readyState==='loading'){
                  document.addEventListener('DOMContentLoaded',kill);
                }
                window.addEventListener('load',kill);
                if(window.MutationObserver){
                  new MutationObserver(kill).observe(document.documentElement,{childList:true,subtree:true});
                }
              }
            })();`,
          }}
        />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
