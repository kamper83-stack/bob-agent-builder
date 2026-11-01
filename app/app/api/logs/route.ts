import { proxyGetToBackend } from "../../lib/proxy";

export function GET() {
  return proxyGetToBackend("/logs");
}
