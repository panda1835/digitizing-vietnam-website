"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";

import { LayoutGrid, List, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

import type { ViewType } from "@/types/view";
import { getImageByKey } from "@/utils/image";
import { trimDescription } from "@/utils/text";
import { formatStrapiDate } from "@/utils/datetime";
import { Link } from "@/i18n/routing";

export default function CollectionView({
  collectionItems,
  collectionSlug,
  locale,
}) {
  const [viewType, setViewType] = useState<ViewType>("grid");

  const t = useTranslations();

  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {collectionItems.map((item, index) => (
        <HoverCard key={index}>
          <HoverCardTrigger asChild>
            <div className="flex flex-col rounded border border-gray-500 overflow-hidden cursor-pointer">
              <Image
                unoptimized
                src={getImageByKey(item.thumbnail.formats, "medium")!.url}
                alt={item.thumbnail.alternativeText}
                className="object-cover w-full h-40"
                width={getImageByKey(item.thumbnail.formats, "medium")!.width}
                height={getImageByKey(item.thumbnail.formats, "medium")!.height}
              />
              <div className="p-4">
                <Link
                  href={`/our-collections/${collectionSlug}/${item.slug}`}
                  className="text-blue-600 hover:underline"
                >
                  <p className="font-semibold text-sm text-primary-blue">
                    {item.title}
                  </p>
                  <p>{}</p>
                </Link>
              </div>
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-80 bg-white">
            <div className="space-y-2">
              <h4 className="font-semibold">{item.title}</h4>
              <ScrollArea className="w-full h-[200px]">
                <p className="text-sm">
                  {trimDescription(item.abstract, 20)}{" "}
                  <Link
                    href={`/our-collections/${item.slug}`}
                    className="text-blue-600  hover:underline"
                  >
                    {t("Button.read-more")}.
                  </Link>
                </p>
                <div className="text-sm text-muted-foreground">
                  <p>
                    <span className="font-bold">Created</span>:{" "}
                    {formatStrapiDate(item.date_created, locale)}
                  </p>
                  {item.contributor.map((contributor) => (
                    <p key={contributor.author.name}>
                      <span className="font-bold">
                        {contributor.author_role_term.name}
                      </span>
                      : {contributor.author.name}
                    </p>
                  ))}
                  <p>
                    <span className="font-bold">Languages</span>:{" "}
                    {item.languages.map((lang) => lang.name).join(", ")}
                  </p>
                  {/* <p>
                <span className="font-bold">Place of publication</span>:{" "}
                {item.place_of_publication.name}
              </p> */}
                  <p>
                    <span className="font-bold">Subjects</span>:{" "}
                    {item.subjects.map((subject) => subject.name).join(", ")}
                  </p>
                  {/* <p>
                <span className="font-bold">Edition</span>: {item.edition}
              </p> */}
                  <p>
                    <span className="font-bold">Publisher</span>:{" "}
                    {item.publisher.name}
                  </p>
                  <p>
                    <span className="font-bold">Collection</span>:{" "}
                    {
                      item.collections.map((collection) => (
                        <Link
                          key={collection.slug}
                          href={`/our-collections/${collection.slug}`}
                          className="text-blue-600 hover:underline"
                        >
                          {collection.title}
                        </Link>
                      ))
                      // .join(", ")
                    }
                  </p>
                </div>
              </ScrollArea>
            </div>
          </HoverCardContent>
        </HoverCard>
      ))}
    </div>
  );

  const ListView = () => (
    <div className="space-y-4">
      {collectionItems.map((item, index) => (
        <div key={index} className="flex gap-4 items-start border rounded p-4">
          <Image
            unoptimized
            src={getImageByKey(item.thumbnail.formats, "medium")!.url}
            alt={item.thumbnail.alternativeText}
            className="w-24 h-24 object-cover rounded"
            width={getImageByKey(item.thumbnail.formats, "medium")!.width}
            height={getImageByKey(item.thumbnail.formats, "medium")!.height}
          />
          <div className="flex-1">
            <Link href={`/our-collections/${item.slug}`}>
              <h3 className="font-semibold">{item.title}</h3>
            </Link>

            <p className="text-sm text-muted-foreground mb-2">
              {trimDescription(item.abstract, 20)}{" "}
              <Link
                href={`/our-collections/${item.slug}`}
                className="text-blue-600 hover:underline"
              >
                {t("Button.read-more")}.
              </Link>
            </p>
            <div className="text-sm text-muted-foreground">
              <p>
                <span className="font-bold">Created</span>:{" "}
                {formatStrapiDate(item.date_created, locale)}
              </p>
              {item.contributor.map((contributor) => (
                <p key={contributor.author.name}>
                  <span className="font-bold">
                    {contributor.author_role_term.name}
                  </span>
                  : {contributor.author.name}
                </p>
              ))}
              <p>
                <span className="font-bold">Languages</span>:{" "}
                {item.languages.map((lang) => lang.name).join(", ")}
              </p>
              {/* <p>
                <span className="font-bold">Place of publication</span>:{" "}
                {item.place_of_publication.name}
              </p> */}
              <p>
                <span className="font-bold">Subjects</span>:{" "}
                {item.subjects.map((subject) => subject.name).join(", ")}
              </p>
              {/* <p>
                <span className="font-bold">Edition</span>: {item.edition}
              </p> */}
              <p>
                <span className="font-bold">Publisher</span>:{" "}
                {item.publisher.name}
              </p>
              <p>
                <span className="font-bold">Collection</span>:{" "}
                {
                  item.collections.map((collection) => (
                    <Link
                      key={collection.slug}
                      href={`/our-collections/${collection.slug}`}
                      className="text-blue-600 hover:underline"
                    >
                      {collection.title}
                    </Link>
                  ))
                  // .join(", ")
                }
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const TableView = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Languages</TableHead>
          <TableHead>Created</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {collectionItems.map((item, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">
              <Link
                href={`/our-collections/${item.slug}`}
                className="hover:underline"
              >
                <p className="font-medium">{item.title}</p>
              </Link>
            </TableCell>
            <TableCell>
              {item.languages.map((lang) => lang.name).join(", ")}
            </TableCell>
            <TableCell>{formatStrapiDate(item.date_created, locale)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <div className="container mx-auto py-6 space-y-6 rounded">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold"></h2>
        <div className="flex gap-2">
          <Button
            variant={viewType === "grid" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewType("grid")}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewType === "list" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewType("list")}
          >
            <List className="h-4 w-4" />
          </Button>
          <Button
            variant={viewType === "table" ? "default" : "outline"}
            size="icon"
            onClick={() => setViewType("table")}
          >
            <Table2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {viewType === "grid" && <GridView />}
      {viewType === "list" && <ListView />}
      {viewType === "table" && <TableView />}
    </div>
  );
}
