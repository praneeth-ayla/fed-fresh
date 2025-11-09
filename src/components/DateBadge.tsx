import { Badge } from "./ui/badge";

export default function DateBadge({ date }: { date: string }) {
  return (
    <Badge className="border border-accent bg-white rounded-full px-3 py-2 text-sm">
      {date}
    </Badge>
  );
}
