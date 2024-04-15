import { createHash } from "crypto"

export async function getHashedPassoword(password: string): Promise<string> {
  const has = createHash("sha256");
  has.update(password);
  return has.digest("hex");
}

