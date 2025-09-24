'use client';

import { Sprout} from "lucide-react";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0">
      <div className="container">
        <div className="min-h-14 flex items-center gap-4 border-b px-4 md:px-6">
          <div className="flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6">
            <Link
              href="#"
              className="flex items-center gap-2 text-lg font-semibold md:text-base"
            >
              <Sprout className="w-auto h-6" />
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
}