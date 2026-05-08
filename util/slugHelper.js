import crypto from "crypto";

export const generateUniqueSlug = async (Model, title, excludeId = null) => {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

  let isUnique = false;
  let slug = baseSlug;

  while (!isUnique) {
    const query = { slug };
    if (excludeId) {
      query._id = { $ne: excludeId };
    }
    
    const existingDoc = await Model.findOne(query);
    if (existingDoc) {
      // If it exists, append a random string
      const randomSuffix = crypto.randomBytes(3).toString("hex");
      slug = `${baseSlug}-${randomSuffix}`;
    } else {
      isUnique = true;
    }
  }

  return slug;
};
