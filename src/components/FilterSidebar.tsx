import { Checkbox } from "@/components/ui/checkbox";

const filters = {
  languages: ["English", "Latin", "Greek", "French", "German"],
  categories: ["Literature", "History", "Photography", "Art", "Science"],
  formats: ["Manuscript", "Image", "Book", "Map", "Audio"],
};

export default function FilterSidebar() {
  return (
    <div className="w-full md:w-64 mb-8 md:mb-0 md:mr-8">
      <h2 className="text-xl font-semibold mb-4">Filters</h2>
      {Object.entries(filters).map(([filterName, options]) => (
        <div key={filterName} className="mb-6">
          <h3 className="text-lg font-medium mb-2 capitalize">{filterName}</h3>
          {options.map((option) => (
            <div key={option} className="flex items-center mb-2">
              <Checkbox id={`${filterName}-${option}`} />
              <label
                htmlFor={`${filterName}-${option}`}
                className="ml-2 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                {option}
              </label>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
