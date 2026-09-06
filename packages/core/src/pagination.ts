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
    const orConditions: any[] = [];
    const num = parseInt(search.replace(/\D/g, ''));
    
    for (const f of options.searchFields) {
      if (f === 'orderNumber' || f === 'billNumber' || f === 'invoiceNumber') {
        if (!isNaN(num)) {
          orConditions.push({ [f]: num });
        }
      } else if (f.includes('.')) {
        const parts = f.split('.');
        const relation = parts[0] as string;
        const field = parts[1] as string;
        orConditions.push({ [relation]: { [field]: { contains: search, mode: "insensitive" } } });
      } else if (f === 'id') {
        orConditions.push({ [f]: { contains: search } }); // id might not support insensitive depending on DB, but usually cuid is case-sensitive
      } else {
        orConditions.push({ [f]: { contains: search, mode: "insensitive" } });
      }
    }
    
    if (orConditions.length > 0) {
      where.OR = orConditions;
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
