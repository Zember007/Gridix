type ApartmentNumberSortable = {
  apartment_number?: string | null;
};

export function isNumericLike(value: string) {
  return value.trim() !== "" && Number.isFinite(Number(value));
}

export function sortByApartmentNumber<T extends ApartmentNumberSortable>(
  a: T,
  b: T,
) {
  const an = a.apartment_number ?? "";
  const bn = b.apartment_number ?? "";

  if (isNumericLike(an) && isNumericLike(bn)) return Number(an) - Number(bn);

  return an.localeCompare(bn, undefined, {
    numeric: true,
    sensitivity: "base",
  });
}

export function sortAndNormalizeApartments<
  TInput,
  TOutput extends ApartmentNumberSortable,
>(data: TInput[] | null | undefined, normalize: (item: TInput) => TOutput) {
  return (data ?? []).map(normalize).sort(sortByApartmentNumber);
}
