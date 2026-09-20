import { useEffect, useState } from "react";

export function useLabRoute() {
  const [route, setRoute] = useState(() => currentHashRoute());

  useEffect(() => {
    const onHashChange = () => setRoute(currentHashRoute());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const openRoute = (nextRoute: string) => {
    window.location.hash = nextRoute;
  };

  return { route, openRoute };
}

function currentHashRoute() {
  const hashRoute = window.location.hash.replace(/^#/, "");
  return hashRoute || "/";
}
