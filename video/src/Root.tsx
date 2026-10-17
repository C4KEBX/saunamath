import React from "react";
import { Composition } from "remotion";
import { Short, type Timeline } from "./Short";
import sample from "./sample.json";

export const FPS = 30;

export const Root: React.FC = () => (
  <Composition
    id="Short"
    component={Short}
    width={1080}
    height={1920}
    fps={FPS}
    durationInFrames={Math.ceil(((sample as Timeline).durationMs / 1000) * FPS)}
    defaultProps={sample as Timeline}
    calculateMetadata={({ props }) => ({ durationInFrames: Math.ceil((props.durationMs / 1000) * FPS) + 6 })}
  />
);
