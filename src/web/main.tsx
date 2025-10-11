import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const target = document.getElementById("root");
if (!target) {
    throw Error("No root found");
}
const root = createRoot(target);
root.render(<App />);
