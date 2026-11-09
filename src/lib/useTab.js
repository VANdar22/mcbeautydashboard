import { useSearchParams } from "react-router-dom";

// Keeps the open tab in the address (?tab=brands) so links and the Dock menu can jump to it.
export function useTab(keys) {
  const [params, setParams] = useSearchParams();
  const asked = params.get("tab");
  const value = keys.includes(asked) ? asked : keys[0];
  return [value, (key) => setParams({ tab: key }, { replace: true })];
}