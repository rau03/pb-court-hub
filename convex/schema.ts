import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  courts: defineTable({
    name: v.string(),
    addressStreet: v.string(),
    addressCity: v.string(),
    addressState: v.string(),
    addressZip: v.string(),
    numCourts: v.number(),
    courtType: v.union(
      v.literal("indoor"),
      v.literal("outdoor"),
      v.literal("mixed"),
      v.literal("unknown")
    ),
    cost: v.union(v.literal("free"), v.literal("paid"), v.literal("unknown")),
    costNotes: v.optional(v.string()),
    adminNotes: v.optional(v.string()),
    status: v.union(
      v.literal("approved"),
      v.literal("pending"),
      v.literal("rejected")
    ),
    submittedBy: v.optional(v.id("users")),
    lastVerifiedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_location", ["addressState", "addressCity"])
    .index("by_court_type", ["courtType"])
    .searchIndex("search_courts", {
      searchField: "name",
      filterFields: ["status", "courtType", "cost"],
    }),

  users: defineTable({
    email: v.string(),
    isAdmin: v.optional(v.boolean()),
    // Convex Auth will handle authentication-related fields
  }),
});
