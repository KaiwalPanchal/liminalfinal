import * as React from "react"
import { ChevronRight, Plus } from "lucide-react"
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
import { Button } from "./button"


export function AppSidebar({ ...props }: any) {
  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <h1
          id="liminal-title"
          className="text-4xl text-white font-normaltitle tracking-[1px] m-2"
        >
          Liminal
        </h1>
        <Button onClick={() => props.addNewNote()} className="mx-4 my-2">
          <Plus /> New Note
        </Button>
        {/* <SearchForm /> */}
      </SidebarHeader>
      <SidebarContent className="gap-0">
        {/* We create a collapsible SidebarGroup for each parent. */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {props.notes.reverse().map((note: any) => (
                <SidebarMenuItem style={{ cursor: "pointer" }} onClick={() => props.setActiveNote(note)} key={note.id}>
                <SidebarMenuButton style={{ backgroundColor: props.activeNote.id === note.id ? "#2b2b2b" : "transparent" }} asChild>
                  <a>{note.title?.slice(0, 20)}{note.title?.length > 20 ? "..." : ""}</a>
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
