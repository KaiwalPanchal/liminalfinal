import Link from 'next/link'
import React from 'react'
import { MdMenuOpen } from 'react-icons/md'
import { RiMenu4Fill } from 'react-icons/ri'

export default function Header({ setIsOpen, isOpen }: any) {
    return (
        <section className='w-full py-2 px-8 fixed top-0 h-[56px] flex justify-between items-start'>
            <div className="flex justify-between items-center">
                <button
                    className={` text-white text-2xl font-bold py-2 pr-4 rounded hover:text-gray-400`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    {isOpen ? <MdMenuOpen /> : <RiMenu4Fill />}
                </button>
                <Link href={'/'} className=' py-2 px-4 '>Liminal</Link>
            </div>
            <button className='font-bold bg-[#3b3b3b] p-1 px-3 rounded-md text-white hover:bg-white hover:text-black'>K</button>
        </section>
    )
}
