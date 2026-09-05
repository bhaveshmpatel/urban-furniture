export async function withPagination(
  req: Request,
  modelDelegate: any,
  options: {
    searchFields?: string[];
    filterField?: string;
    include?: any;
    baseWhere?: any;
    orderByField?: string;
  } = {}
) {
  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "10");
  const search = searchParams.get("search") || "";
  const sortOrder = searchParams.get("sortOrder") || "NEWEST";
  const filter = searchParams.get("statusFilter") || "ALL";

  const where: any = { ...options.baseWhere };
  
  if (search && options.searchFields && options.searchFields.length > 0) {
    where.OR = options.searchFields.map(f => ({ [f]: { contains: search, mode: "insensitive" } }));
    // Try to match IDs too if it looks like a sequence
    if (search.match(/\d+/)) {
       const num = parseInt(search.replace(/\D/g, ''));
       if (!isNaN(num) && options.searchFields.includes('id')) {
         // This is a hacky way to support sequence numbers in generic search, we'd need to know the seq field name
       }
    }
  }

  if (filter !== "ALL" && options.filterField) {
    where[options.filterField] = filter;
  }

  const orderByField = options.orderByField || 'createdAt';
  
  const [data, total] = await Promise.all([
    modelDelegate.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { [orderByField]: sortOrder === "NEWEST" ? "desc" : "asc" },
      include: options.include
    }),
    modelDelegate.count({ where })
  ]);

  if (searchParams.get("paginate") !== "true") {
    return data;
  }

  return { data, metadata: { total, page, totalPages: Math.ceil(total / limit) } };
}
