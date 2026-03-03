'use client';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
  useUser,
} from '@clerk/nextjs';

const navItems = [
  { name: 'Library', href: '/' },
  { name: 'Add new', href: '/book/new' },
  { name: 'Pricing', href: '/subscriptions' },
]

const Navbar = () => {
  const pathname = usePathname();
  const { user } = useUser() || {};
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <header className="w-full fixed z-50 bg-(--bg-primary)">
      <div className="wrapper navbar-height py-4 flex items-center justify-between">
        <Link href="/" className="flex gap-0.5 items-center">
          <Image className='w-auto h-auto' src="/assets/logo.png" alt="Bookified Logo" width={46} height={26} />
          <span className="logo-text">Bookified</span>
        </Link>
        <nav className="w-fit flex items-center gap-3 md:gap-7.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link key={item.name} href={item.href} className={cn("nav-link-base", isActive ? "nav-link-active" : "text-black hover:opacity-70")}>
                {item.name}
              </Link>
            )
          })}
          <div className="flex items-center gap-7.5">
            <SignedOut>
              <SignInButton mode="modal" />
            </SignedOut>
            <SignedIn>
              <div className='nav-user-link'>
                <UserButton />
                {isMounted && user?.firstName && (
                  <span className="nav-user-name cursor-pointer" onClick={() => document.querySelector<HTMLButtonElement>('.cl-userButtonTrigger')?.click()}>
                    {user.firstName}
                  </span>
                )}
              </div>
            </SignedIn>
          </div>
        </nav>
      </div>
    </header>
  )
}

export default Navbar