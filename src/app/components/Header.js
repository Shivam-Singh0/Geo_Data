"use client"
import React from "react";
import {
    Navbar,
    MobileNav,
    Typography,
    IconButton,
    Collapse,
} from "@material-tailwind/react";
import Link from 'next/link';
import {  SignInButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';


export function Header() {
    const [openNav, setOpenNav] = React.useState(false);

    React.useEffect(() => {
        window.addEventListener(
            "resize",
            () => window.innerWidth >= 960 && setOpenNav(false),
        );
    }, []);

    const navList = (
        <ul className="mt-2 mb-4 flex flex-col gap-2 lg:mb-0 lg:mt-0 lg:flex-row lg:items-center lg:gap-6">
            <Link
               href={"/upload"}
                variant="small"
                color="white"
                className="p-1 font-normal hover:text-gray-300 transition-colors duration-200"
            >
             
                    Upload
               
            </Link>
           
        </ul>
    );

    return (
        <div className="w-full overflow-x-hidden">
            <Navbar className="sticky top-0 z-10 h-max max-w-full rounded-none px-4 py-2 lg:px-8 lg:py-4 bg-black shadow-md border-none"> {/* border-none added */}
                <div className="flex items-center justify-between text-white">
                   
                    
                        <Link href="/" className="flex items-center">
                    GEO DATA
                </Link>
                  
                    <div className="flex items-center gap-4">
                        <div className="mr-4 hidden lg:block">{navList}</div>
                        <div className="flex items-center gap-x-1">
                            <SignedOut>
                                <SignInButton />
                            </SignedOut>
                            <SignedIn>
                                <UserButton />
                            </SignedIn>
                        </div>
                        <IconButton
                            variant="text"
                            className="ml-auto h-6 w-6 text-white hover:bg-transparent focus:bg-transparent active:bg-transparent lg:hidden"
                            ripple={false}
                            onClick={() => setOpenNav(!openNav)}
                        >
                            {openNav ? (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    className="h-6 w-6"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            ) : (
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-6 w-6"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth={2}
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                </svg>
                            )}
                        </IconButton>
                    </div>
                </div>
                <Collapse open={openNav}>
                    {navList}
                    <div className="flex items-center gap-x-1">
                        <SignedOut>
                            <SignInButton />
                        </SignedOut>
                        <SignedIn>
                            <UserButton />
                        </SignedIn>
                    </div>
                </Collapse>
            </Navbar>
        </div>
    );
}