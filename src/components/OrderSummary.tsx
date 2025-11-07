import { OrderSummaryProps } from "@/types/types";

export default function OrderSummary({
  items,
  totalPrice,
  totalDeliveries,
}: OrderSummaryProps) {
  return (
    <div className="mb-6">
      <h3 className="font-medium mb-4 text-lg">Order Summary</h3>
      {items.map((item) => {
        const addonsTotal =
          item.addons?.reduce((s, a) => s + a.pricePence, 0) ?? 0;
        const itemTotal =
          ((item.pricePence + addonsTotal) *
            item.quantity *
            item.deliveryDates.length) /
          100;

        return (
          <div key={item.uniqueKey} className="border-b pb-4 mb-4">
            <div className="flex justify-between">
              <p className="font-medium">{item.name}</p>
              <p className="font-medium">£{itemTotal.toFixed(2)}</p>
            </div>

            <p className="text-sm text-gray-600">
              Type: {item.orderType.replace("_", " ")} • Qty: {item.quantity}{" "}
              per delivery
            </p>

            {item.deliveryDates.length > 0 && (
              <div className="mt-1">
                <p className="text-xs text-gray-500 font-medium">
                  {item.deliveryDates.length} Delivery
                  {item.deliveryDates.length > 1 ? "s" : ""}:
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {item.deliveryDates.slice(0, 3).map((date) => (
                    <span
                      key={date}
                      className="text-xs bg-gray-100 px-2 py-1 rounded"
                    >
                      {date}
                    </span>
                  ))}
                  {item.deliveryDates.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{item.deliveryDates.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            )}

            {item.addons?.length ? (
              <ul className="text-sm text-gray-500 ml-4 mt-1">
                {item.addons.map((a) => (
                  <li key={a.id}>
                    + {a.name} (£{(a.pricePence / 100).toFixed(2)} per delivery)
                  </li>
                ))}
              </ul>
            ) : null}
          </div>
        );
      })}

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-2">
          <p className="text-gray-600">Total Deliveries:</p>
          <p className="text-gray-600">{totalDeliveries}</p>
        </div>
        <p className="text-lg font-bold">
          Total: £{(totalPrice / 100).toFixed(2)}
        </p>
      </div>
    </div>
  );
}
