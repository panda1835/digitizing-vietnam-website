import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ScrollArea } from "@/components/ui/scroll-area";
import LookupableHanNomText from "@/components/common/LookupableHanNomText";
import NavLink from "../NavLink";

// Type definitions
type Item = {
  id: string;
  num: number;
  hnTitle: string;
};

type GroupedData = {
  [group: string]: {
    [title: string]: Item[];
  };
};

type TOCProps = {
  groupedData: GroupedData;
  currentTopic: string;
};

export function TOC({ groupedData, currentTopic }: TOCProps) {
  return (
    <aside className="w-full lg:w-96 shrink-0 font-light font-['Helvetica Neue']">
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-branding-brown uppercase flex justify-center">
          <div className="text-xl font-normal text-white">Quốc Âm Thi Tập</div>
        </div>
        <ScrollArea className="h-[500px] md:h-[600px] w-full">
          <div className="flex flex-col">
            {Object.entries(groupedData).map(([group, titles]) => (
              <div key={group} className="p-4">
                <div className="text-center font-semibold mb-2">
                  <LookupableHanNomText
                    text={group}
                    className="text-2xl text-branding-brown"
                  />
                </div>

                {Object.entries(titles).map(([title, items]) => {
                  const isOpen = items.some((item) => item.id == currentTopic);

                  return (
                    <Accordion
                      key={title}
                      type="single"
                      collapsible
                      defaultValue={isOpen ? title : undefined}
                      className="w-full"
                    >
                      <AccordionItem value={title}>
                        <AccordionTrigger className="text-left text-lg font-medium">
                          {title}
                        </AccordionTrigger>
                        <AccordionContent>
                          {items.map((item) => (
                            <NavLink
                              key={item.id}
                              topic={item.id}
                              currentTopic={currentTopic}
                            >
                              {items.length > 1 ? (
                                <div className="text-lg">
                                  {title} bài {item.num}
                                </div>
                              ) : (
                                <div className="text-lg">{title}</div>
                              )}
                              <LookupableHanNomText
                                text={item.hnTitle}
                                className="text-lg"
                              />
                            </NavLink>
                          ))}
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  );
                })}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>
    </aside>
  );
}
