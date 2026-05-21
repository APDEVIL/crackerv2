import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@/server/better-auth";

const f = createUploadthing();

// ── Auth helper ────────────────────────────────────────────
async function getUser(req: Request) {
  const session = await auth.api.getSession({
    headers: req.headers,
  });
  return session?.user ?? null;
}

// ── Admin guard helper ─────────────────────────────────────
async function getAdmin(req: Request) {
  const user = await getUser(req);
  if (!user) throw new UploadThingError("Unauthorized");
  if (user.role !== "admin") throw new UploadThingError("Forbidden");
  return user;
}

// ── File Router ────────────────────────────────────────────
export const ourFileRouter = {

  // Used by: admin product create/edit form
  // Accepts: up to 8 images per product
  productImages: f({
    image: { maxFileSize: "4MB", maxFileCount: 8 },
  })
    .middleware(async ({ req }) => {
      const user = await getAdmin(req);
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[UT] productImages upload by:", metadata.userId);
      console.log("[UT] file url:", file.url);
      return { url: file.url };
    }),

  // Used by: admin product create/edit form
  // Accepts: single demo video per product
  productVideo: f({
    video: { maxFileSize: "64MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const user = await getAdmin(req);
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[UT] productVideo upload by:", metadata.userId);
      console.log("[UT] file url:", file.url);
      return { url: file.url };
    }),

  // Used by: admin slides manager
  // Accepts: single banner image per slide
  slideImage: f({
    image: { maxFileSize: "8MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const user = await getAdmin(req);
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[UT] slideImage upload by:", metadata.userId);
      console.log("[UT] file url:", file.url);
      return { url: file.url };
    }),

  // Used by: category create/edit form
  // Accepts: single category icon/banner image
  categoryImage: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const user = await getAdmin(req);
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[UT] categoryImage upload by:", metadata.userId);
      console.log("[UT] file url:", file.url);
      return { url: file.url };
    }),

  // Used by: user profile page
  // Accepts: single avatar image
  userAvatar: f({
    image: { maxFileSize: "2MB", maxFileCount: 1 },
  })
    .middleware(async ({ req }) => {
      const user = await getUser(req);
      if (!user) throw new UploadThingError("Unauthorized");
      return { userId: user.id };
    })
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("[UT] userAvatar upload by:", metadata.userId);
      console.log("[UT] file url:", file.url);
      return { url: file.url };
    }),

} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;