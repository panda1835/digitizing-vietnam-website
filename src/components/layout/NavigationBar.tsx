"use client";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import LocaleSwitcher from "@/components/layout/LocaleSwitcher";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

import { Logo } from "@/components/layout/Logo";
const NavigationBar = () => {
  const t = useTranslations("NavigationBar");

  const navItems = [
    { key: "about-us", href: "/about-us" },
    { key: "our-collections", href: "/our-collections" },
    { key: "tools", href: "/tools" },
    { key: "outreach", href: "/pedagogy" },
    { key: "highlights", href: "/highlights" },
    { key: "online-resources", href: "/online-resources" },
  ];

  const outreachItems = [
    { key: "vietnam-for-educators", href: "vietnam-for-educators" },
    { key: "understanding-vietnam", href: "understanding-vietnam" },
  ];

  return (
    <header className="bg-branding-white px-[20px] md:px-[50px] shadow-[0px_4px_55px_0px_rgba(0,0,0,0.10)]">
      <nav className="flex py-[40px] mx-auto items-center justify-between">
        <Logo />
        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList>
            {navItems.map((item) => (
              <NavigationMenuItem key={item.key}>
                <Link href={item.href} legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "group bg-transparent inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-base font-['Helvetica Neue'] font-light transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                    )}
                  >
                    {t(item.key)}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))}
            {/* <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent text-base font-['Helvetica Neue'] font-light">
                {t("outreach")}
              </NavigationMenuTrigger>
              <NavigationMenuContent className="right:0 absolute left-auto top-full w-auto mt-2">
                <ul className="w-[300px] gap-3 p-4 bg-white rounded-md shadow-[0px_4px_55px_0px_rgba(0,0,0,0.10)]">
                  {outreachItems.map((item) => (
                    <li key={item.key}>
                      <NavigationMenuLink asChild>
                        <Link
                          href={item.href}
                          className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                        >
                          <div className="text-base font-['Helvetica Neue'] font-light leading-none">
                            {t(item.key)}
                          </div>
                        </Link>
                      </NavigationMenuLink>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            {navItems.slice(3, 5).map((item) => (
              <NavigationMenuItem key={item.key}>
                <Link href={item.href} legacyBehavior passHref>
                  <NavigationMenuLink
                    className={cn(
                      "group bg-transparent inline-flex h-10 w-max items-center justify-center rounded-md px-4 py-2 text-base font-['Helvetica Neue'] font-light transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50"
                    )}
                  >
                    {t(item.key)}
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            ))} */}
          </NavigationMenuList>

          <div className="hidden lg:block ml-6 w-16">
            <LocaleSwitcher />
          </div>
        </NavigationMenu>

        <Sheet>
          <SheetTrigger asChild className="lg:hidden">
            <Button variant="outline" size="icon">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <nav className="flex flex-col gap-4">
              {navItems.map((item) => (
                <Link
                  key={item.key}
                  href={item.href}
                  className="block py-2 text-lg font-['Helvetica Neue'] font-light"
                >
                  {t(item.key)}
                </Link>
              ))}
              {/* <div className="py-2">
                <div className="text-lg font-['Helvetica Neue'] font-light">
                  {t("outreach")}
                </div>
                <div className="pl-4 mt-2 flex flex-col gap-2 font-['Helvetica Neue'] font-light">
                  {outreachItems.map((item) => (
                    <Link
                      key={item.key}
                      href={item.href}
                      className="block py-1 text-base"
                    >
                      {t(item.key)}
                    </Link>
                  ))}
                </div>
              </div> */}
              <div className="block w-16">
                <LocaleSwitcher />
              </div>
            </nav>
          </SheetContent>
        </Sheet>
      </nav>
    </header>
  );
};

export default NavigationBar;
