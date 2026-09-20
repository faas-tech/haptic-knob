import { useMemo, useState, type FormEvent } from "react";
import {
  createDraftLabApp,
  readCustomLabApps,
  writeCustomLabApps,
} from "../apps/customLabApps";
import { BUILT_IN_LAB_APPS, type LabApp } from "../apps/labApps";
import { EcmStatorMark } from "../brand/EcmStatorMark";
import { DiscGolfTileArt } from "../brand/DiscGolfTileArt";
import { GolfTileArt } from "../brand/GolfTileArt";
import { PlusIcon } from "../brand/LabIcons";

export function LaunchScreen(props: { onOpenApp: (route: string) => void }) {
  const [customLabApps, setCustomLabApps] = useState<LabApp[]>(() =>
    readCustomLabApps(),
  );
  const [draftTitle, setDraftTitle] = useState("");
  const [draftTagline, setDraftTagline] = useState("");
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);

  const launchPadApps = useMemo(
    () => [...BUILT_IN_LAB_APPS, ...customLabApps],
    [customLabApps],
  );

  const addDraftApp = (event: FormEvent) => {
    event.preventDefault();
    const title = draftTitle.trim();
    if (!title) {
      return;
    }
    const nextCustomLabApps = [
      ...customLabApps,
      createDraftLabApp(title, draftTagline.trim()),
    ];
    writeCustomLabApps(nextCustomLabApps);
    setCustomLabApps(nextCustomLabApps);
    setDraftTitle("");
    setDraftTagline("");
    setIsAddFormOpen(false);
  };

  const removeCustomApp = (appId: string) => {
    const nextCustomLabApps = customLabApps.filter((app) => app.id !== appId);
    writeCustomLabApps(nextCustomLabApps);
    setCustomLabApps(nextCustomLabApps);
  };

  return (
    <section className="launch-screen">
      <div className="launch-hero">
        <div className="hero-stator-wrap" aria-hidden="true">
          <EcmStatorMark className="hero-stator" />
        </div>
        <div className="hero-copy">
          <p className="eyebrow">Mission select</p>
          <h1>Launch an experiment</h1>
          <p>
            Each tile is a SmartKnob demo. The knob is the controller. Add a
            draft tile when you have the next idea.
          </p>
          <p className="hero-score">
            <span>{launchPadApps.filter((app) => app.status === "ready").length}</span>
            live
            <span>{customLabApps.length}</span>
            drafts
          </p>
        </div>
      </div>

      <ul className="app-grid">
        {launchPadApps.map((labApp) => (
          <li key={labApp.id}>
            {labApp.route ? (
              <button
                type="button"
                className={`app-tile accent-${labApp.accent}`}
                onClick={() => props.onOpenApp(labApp.route!)}
              >
                <AppTileBody labApp={labApp} />
              </button>
            ) : (
              <div className={`app-tile accent-${labApp.accent} is-draft`}>
                <AppTileBody labApp={labApp} />
                {labApp.isCustom ? (
                  <button
                    type="button"
                    className="tile-remove"
                    onClick={() => removeCustomApp(labApp.id)}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            )}
          </li>
        ))}
        <li>
          <div className="app-tile add-tile">
            {isAddFormOpen ? (
              <form className="add-app-form" onSubmit={addDraftApp}>
                <label>
                  Example name
                  <input
                    value={draftTitle}
                    onChange={(event) => setDraftTitle(event.target.value)}
                    placeholder="Spring return"
                    autoFocus
                  />
                </label>
                <label>
                  One-line brief
                  <input
                    value={draftTagline}
                    onChange={(event) => setDraftTagline(event.target.value)}
                    placeholder="Hold a heading, then snap home."
                  />
                </label>
                <div className="add-app-actions">
                  <button type="submit" className="button-primary">
                    Add to launch pad
                  </button>
                  <button
                    type="button"
                    className="button-ghost"
                    onClick={() => setIsAddFormOpen(false)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                className="add-tile-button"
                onClick={() => setIsAddFormOpen(true)}
              >
                <PlusIcon className="add-tile-icon" />
                <strong>Add an example</strong>
                <span>Name it now. Wire the demo later.</span>
              </button>
            )}
          </div>
        </li>
      </ul>
    </section>
  );
}

function AppTileBody(props: { labApp: LabApp }) {
  return (
    <>
      <div
        className={
          props.labApp.id === "ruler"
            ? "tile-art tile-art-ruler"
            : props.labApp.id === "golf"
              ? "tile-art tile-art-golf"
              : props.labApp.id === "disc-golf"
                ? "tile-art tile-art-disc-golf"
                : "tile-art"
        }
        style={
          props.labApp.tileImageSrc
            ? { backgroundImage: `url("${props.labApp.tileImageSrc}")` }
            : undefined
        }
      >
        {props.labApp.id === "golf" ? <GolfTileArt /> : null}
        {props.labApp.id === "disc-golf" ? <DiscGolfTileArt /> : null}
        {props.labApp.tileImageSrc ? (
          <img src={props.labApp.tileImageSrc} alt="" />
        ) : null}
        <span className={`tile-badge status-${props.labApp.status}`}>
          {props.labApp.status === "ready" ? "Live" : "Draft"}
        </span>
      </div>
      <div className="tile-copy">
        <h2>{props.labApp.title}</h2>
        <p>{props.labApp.tagline || "No brief yet."}</p>
      </div>
    </>
  );
}
