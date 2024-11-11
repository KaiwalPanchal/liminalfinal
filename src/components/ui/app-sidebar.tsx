import * as React from "react"
import { ChevronRight } from "lucide-react"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar"
import { SearchForm } from "./search-form"


export function AppSidebar({ ...props }: any) {
  // const [data, setData] = React.useState()
console.log(props);

  
  return (
    <Sidebar {...props}>
      <SidebarHeader>
      <h1
            id="liminal-title"
            className="text-4xl text-white font-normaltitle tracking-[1px] m-2"
          >
            Liminal
          </h1>
        <SearchForm />
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {/* We create a collapsible SidebarGroup for each parent. */}
        <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu> 
                    {props.notes.map((note: any) => (
                       <SidebarMenuItem onClick={() => props.setActiveNote(note)} key={note.id}>
                       <SidebarMenuButton asChild>
                         <a>{note.title}</a>
                       </SidebarMenuButton>
                     </SidebarMenuItem>
                    ))} 
                  </SidebarMenu>
                </SidebarGroupContent>
            </SidebarGroup>
        {/* {data.navMain.map((item:any) => (
          <Collapsible
            key={item.title}
            title={item.title}
            defaultOpen
            className="group/collapsible"
          >
            
          </Collapsible>
        ))} */}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  )
}
