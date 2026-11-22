import { apiFetch } from "./http";
export type SupportMessage = { author: string; body: string; createdAt: string; internal?: boolean };
export type SupportTicket = { id: string; number: string; role: string; name: string; email: string; category: string; subcategory: string; subject: string; message: string; status: string; priority: string; assignedTo?: string; messages: SupportMessage[]; createdAt: string; updatedAt: string };
export const supportApi = {
 contact: (body: Record<string,string>) => apiFetch<{ok:boolean}>("/contact/messages",{method:"POST",body}),
 contactReply: (id:string,message:string) => apiFetch(`/admin/contact/messages/${id}/reply`,{method:"POST",body:{message}}),
 contacts: () => apiFetch<{messages:Array<{_id:string;name:string;email:string;role:string;category:string;subcategory:string;subject:string;message:string;createdAt:string}>}>("/admin/contact/messages"),
 create: (body: Record<string,string>) => apiFetch<{ticket:SupportTicket}>("/support/tickets",{method:"POST",body}),
 mine: () => apiFetch<{tickets:SupportTicket[]}>("/support/tickets"),
 all: () => apiFetch<{tickets:SupportTicket[]}>("/admin/support/tickets"),
 reply: (id:string,message:string,internal=false,admin=false) => apiFetch(`/`+(admin?"admin/":"")+`support/tickets/${id}/reply`,{method:"POST",body:{message,internal}}),
 update: (id:string,body:{status?:string;priority?:string;assignedTo?:string}) => apiFetch(`/admin/support/tickets/${id}`,{method:"PATCH",body}),
};
