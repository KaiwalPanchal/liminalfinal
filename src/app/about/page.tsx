import Link from "next/link";
import React from "react";

export default function AboutPage() {
  return (
    <div>
      About
      <li>
        <Link href="/" className="text-sm hover:underline text-white">
          HOME
        </Link>
      </li>
    </div>
  );
}
