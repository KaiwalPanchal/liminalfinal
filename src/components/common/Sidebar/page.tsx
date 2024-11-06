// components/Sidebar.js
import React, { useState } from 'react';
import { RiMenu4Fill } from "react-icons/ri";
import { MdMenuOpen } from "react-icons/md";
import Link from 'next/link';
const items = [
    { label: 'New Chat', href: '/' },
    { label: 'Github repo', href: '/' },
    { label: 'Explore More', href: '/' },
    { label: 'Extensions', href: '/' },
    { label: 'Save your code to VS code', href: '/' },
]

const SidebarSection = ({setIsOpen, isOpen}: any) => {

    return (
        <div className={` text-white h-screen ${isOpen ? 'w-64 overflow-hidden  border-r border-gray-700 ' : 'w-0 overflow-hidden'} transition-all duration-300`}>
            {/* Main content */}
            <div className={`p-2 h-fit w-64 top-0 left-0  ${isOpen ? 'bg-black  border-r !border-gray-700' : 'bg-black'} border-r border-transparent transition-all duration-300`}>
                {/* Button to toggle sidebar */}
                <div className="flex justify-between items-center">
                    <button
                        className={` text-white text-2xl font-bold py-2 px-4 rounded hover:text-gray-400`}
                        onClick={() => setIsOpen(!isOpen)}
                    >
                        {isOpen ? <MdMenuOpen /> : <RiMenu4Fill />}
                    </button>
                    <Link href={'/'} className=' py-2 px-4 '>Liminal</Link>
                </div>
            </div>
            {/* Sidebar */}
            <div
                className={`bg-black text-white transition-all duration-300 z-10 border-t border-gray-700`}
            >
                <div className={`flex flex-col items-start  transition-all duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'} pl-8`}>

                    {items?.map((item, index) => {
                        return (
                            <div key={index} className={`mt-4 ${isOpen ? 'opacity-100 w-44' : 'opacity-0 w-0'}`}>
                                <a href="#" className={`text-white text-sm hover:text-gray-400 `}>{item.label}</a>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    );
};

export default SidebarSection;