import { Checkbox } from "../ui/checkbox";

const makeSafeId = (title: string) => {
  const normalized = title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return `tutorial-step-${normalized || "item"}`;
};

export function TutorialStep({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const safeId = makeSafeId(title);

  return (
    <li className="relative">
      <Checkbox
        id={safeId}
        name={safeId}
        className={`absolute top-[3px] mr-2 peer`}
      />
      <label
        htmlFor={safeId}
        className={`relative text-base text-foreground peer-checked:line-through font-medium`}
      >
        <span className="ml-8">{title}</span>
        <div
          className={`ml-8 text-sm peer-checked:line-through font-normal text-muted-foreground`}
        >
          {children}
        </div>
      </label>
    </li>
  );
}
