import dynamic from "next/dynamic"

const MainContent = dynamic(() => import("./main"), { ssr: false })

const Page = () => {
  return <MainContent />
}

export default Page