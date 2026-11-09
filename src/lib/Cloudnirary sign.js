// Lives in the ADMIN DASHBOARD project.
// Gives a logged-in admin a one-time signature so their browser can upload straight to Cloudinary.
// The Cloudinary API secret stays here and never reaches the browser.
//
// Env: CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET,
//      CLERK_SECRET_KEY, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// npm i @clerk/backend @supabase/supabase-js

const crypto = require("crypto");
const { verifyToken } = require("@clerk/backend");
const { createClient } = require("@supabase/supabase-js");

const db = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const FOLDER = "products";

const json = (statusCode, body) => ({ statusCode, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method not allowed" });

  // 1. Who is asking?
  const auth = event.headers.authorization ?? event.headers.Authorization ?? "";
  if (!auth.startsWith("Bearer ")) return json(401, { error: "Sign in first." });
  let userId;
  try {
    userId = (await verifyToken(auth.slice(7), { secretKey: process.env.CLERK_SECRET_KEY })).sub;
  } catch {
    return json(401, { error: "Session expired." });
  }

  // 2. Are they an admin?
  const { data: admin } = await db.from("admins").select("user_id").eq("user_id", userId).maybeSingle();
  if (!admin) return json(403, { error: "Admins only." });

  // 3. Sign the upload (parameters sorted alphabetically, then the secret is appended)
  const timestamp = Math.floor(Date.now() / 1000);
  const toSign = `folder=${FOLDER}&timestamp=${timestamp}`;
  const signature = crypto.createHash("sha1").update(toSign + process.env.CLOUDINARY_API_SECRET).digest("hex");

  return json(200, {
    signature,
    timestamp,
    folder: FOLDER,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
};