"use client";
import React, { useRef, useState } from 'react';
import { SiSololearn } from "react-icons/si";
import { FaArrowUp } from "react-icons/fa6";

const cards = [
    { icon: 'SiSololearn', label: 'Learn Coding' },
    { icon: 'SiSololearn', label: 'Build a responsive sidebar' },
    { icon: 'SiSololearn', label: 'Github command list' },
    { icon: 'SiSololearn', label: 'Need to sleep, free your mind' },
]

export default function ChatScreen() {
    const [text, setText] = useState('');
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(event.target.value);

        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto'; // Reset height to auto
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`; // Set height based on scroll height

            // Apply max height of 500px
            if (textareaRef.current.scrollHeight > 300) {
                textareaRef.current.style.height = '300px';
                textareaRef.current.style.overflowY = 'auto'; // Allow vertical scrolling if max height is reached
            } else {
                textareaRef.current.style.overflowY = 'hidden'; // Hide overflow if below max height
            }
        }
    };
    return (
        <div className='text-white my-[56px] w-full flex justify-between flex-col px-8 items-center chat xl:h-auto lg:h-auto md:h-auto sm:h-full h-full'>
            <div className='pt-20 flex flex-col items-center'>
                <h3 className='text-3xl pb-10 text-center'>Good Night it's time to sleep</h3>
                <div className='flex flex-wrap gap-2'>
                    {cards?.map((data: any, index: number) => {
                        return (
                            <div key={index} className='card cursor-pointer rounded-xl border border-gray-800 text-gray-400 hover:text-white p-4 hover:bg-[#3b3b3b] hover:border hover:border-[#3b3b3b]'>
                                {data?.label}
                            </div>
                        )
                    })}
                </div>
            </div>
            <div className='group  xl:w-[600px] lg:w-[500px] md:[500px] sm:w-full w-full  active:bg-[#3b3b3b] focus:bg-[#3b3b3b] hover:bg-[#3b3b3b] border border-gray-800 hover:border-gray-700 rounded-lg p-4 flex items-center'>
                <div className='w-full flex items-center'>
                    <textarea
                        ref={textareaRef}
                        className='resize-none group !max-h-[350px] group-hover:bg-transparent overflow-hidden bg-black text-white w-full outline-none shadow-none placeholder:text-gray-400'
                        placeholder="Ask me anything"
                        value={text}
                        onChange={handleChange}
                        rows={1} // Start with a single row
                        style={{ lineHeight: '1.5', maxHeight: '400px' }} // Optional: adjust line height and min height

                    />
                </div>
                    <button className={`bg-white rounded-full text-black p-2 ml-2 ${text !== '' ? 'opacity-100' : 'opacity-0'} transition-all duration-400`}>
                        <FaArrowUp />
                    </button>
            </div>
        </div>
    )
}
