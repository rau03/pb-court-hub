import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id, Doc } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";

export const create = mutation({
  args: {
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
  },
  handler: async (ctx, args) => {
    const courtId: Id<"courts"> = await ctx.db.insert("courts", {
      ...args,
      lastVerifiedAt: Date.now(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return courtId;
  },
});

export const list = query({
  args: {
    paginationOpts: paginationOptsValidator,
    searchQuery: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("approved"),
        v.literal("pending"),
        v.literal("rejected")
      )
    ),
    courtType: v.optional(
      v.union(
        v.literal("indoor"),
        v.literal("outdoor"),
        v.literal("mixed"),
        v.literal("unknown")
      )
    ),
    cost: v.optional(
      v.union(v.literal("free"), v.literal("paid"), v.literal("unknown"))
    ),
    state: v.optional(v.string()),
    city: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const {
      paginationOpts,
      searchQuery,
      status,
      courtType,
      cost,
      state,
      city,
    } = args;

    if (searchQuery) {
      const results = await ctx.db
        .query("courts")
        .withSearchIndex("search_courts", (q) => {
          let search = q.search("name", searchQuery);
          if (status) search = search.eq("status", status);
          if (courtType) search = search.eq("courtType", courtType);
          // Cost is usually not part of a text search index directly for eq comparison
          // but can be if it's denormalized into searchable text or if the index supports structured data.
          // For now, assuming it might be part of the search criteria if the index supports it.
          if (cost && q.eq("cost", cost)) {
            // Check if eq is available on this specific search query builder for 'cost'
            search = search.eq("cost", cost);
          }
          return search;
        })
        .paginate(paginationOpts);
      return results;
    }

    let queryBuilder = ctx.db.query("courts");

    // This is a simplified way. If you need to combine index queries (e.g., status AND city),
    // you'd typically use the most specific index that covers the fields or do client-side filtering.
    // Convex's query capabilities are powerful but require careful schema and index design for complex filter combinations.

    if (status) {
      queryBuilder = queryBuilder.withIndex("by_status", (q) =>
        q.eq("status", status)
      );
    } else if (courtType) {
      // Note: using else if implies filters are mutually exclusive or prioritized
      queryBuilder = queryBuilder.withIndex("by_court_type", (q) =>
        q.eq("courtType", courtType)
      );
    } else if (state || city) {
      queryBuilder = queryBuilder.withIndex("by_location", (q) => {
        let finalQuery = q;
        if (state) finalQuery = finalQuery.eq("addressState", state);
        if (city) finalQuery = finalQuery.eq("addressCity", city); // This assumes your by_location index can filter by city after state, or by city alone if state is not provided.
        return finalQuery;
      });
    }
    // If no specific indexed filter is applied, it will be a full table scan (paginated).

    const results = await queryBuilder.paginate(paginationOpts);

    // Apply non-indexed cost filter last, if it wasn't part of an indexed query or search
    if (cost && !searchQuery) {
      // Apply only if not handled by search and cost is present
      return {
        ...results,
        page: results.page.filter(
          (court: Doc<"courts">) => court.cost === cost
        ),
      };
    }

    return results;
  },
});

export const update = mutation({
  args: {
    id: v.id("courts"),
    name: v.optional(v.string()),
    addressStreet: v.optional(v.string()),
    addressCity: v.optional(v.string()),
    addressState: v.optional(v.string()),
    addressZip: v.optional(v.string()),
    numCourts: v.optional(v.number()),
    courtType: v.optional(
      v.union(
        v.literal("indoor"),
        v.literal("outdoor"),
        v.literal("mixed"),
        v.literal("unknown")
      )
    ),
    cost: v.optional(
      v.union(v.literal("free"), v.literal("paid"), v.literal("unknown"))
    ),
    costNotes: v.optional(v.string()),
    adminNotes: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("approved"),
        v.literal("pending"),
        v.literal("rejected")
      )
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const court = await ctx.db.get(id);
    if (!court) {
      throw new Error("Court not found");
    }
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });
    return id;
  },
});

export const remove = mutation({
  args: {
    id: v.id("courts"),
  },
  handler: async (ctx, args) => {
    const { id } = args;
    const court = await ctx.db.get(id);
    if (!court) {
      throw new Error("Court not found");
    }
    await ctx.db.delete(id);
    return id;
  },
});
