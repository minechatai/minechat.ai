import { useState } from "react";
import { Link, useLocation } from "wouter";
import { MessageSquare, BarChart3, MessageCircle, Settings, Users, User, LogOut, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: BarChart3 },
  { name: "Chat", href: "/chat", icon: MessageCircle },
  { 
    name: "Setup", 
    icon: Settings, 
    children: [
      { name: "AI Assistant", href: "/setup/ai-assistant" },
      { name: "Business Information", href: "/setup/business-info" },
      { name: "Channels", href: "/setup/channels" },
    ]
  },
  { name: "CRM", href: "/crm", icon: Users },
  { name: "Accounts", href: "/accounts", icon: User },
];

export default function Sidebar() {
  const [location] = useLocation();
  const [setupOpen, setSetupOpen] = useState(location.startsWith("/setup"));

  const isActive = (href: string) => {
    if (href === "/dashboard" && location === "/") return true;
    return location.startsWith(href);
  };

  return (
    <div className="w-64 bg-white dark:bg-gray-900 shadow-sm border-r border-gray-200 dark:border-gray-700 flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-3">
          <img 
            src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAACXBIWXMAAAsTAAALEwEAmpwYAAAKT2lDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVNnVFPpFj333vRCS4iAlEtvUhUIIFJCi4AUkSYqIQkQSoghodkVUcERRUUEG8igiAOOjoCMFVEsDIoK2AfkIaKOg6OIisr74Xuja9a89+bN/rXXPues852zzwfACAyWSDNRNYAMqUIeEeCDx8TG4eQuQIEKJHAAEAizZCFz/SMBAPh+PDwrIsAHvgABeNMLCADATZvAMByH/w/qQplcAYCEAcB0kThLCIAUAEB6jkKmAEBGAYCdmCZTAKAEAGDLY2LjAFAtAGAnf+bTAICd+Jl7AQBblCEVAaCRACATZYhEAGg7AKzPVopFAFgwABRmS8Q5ANgtADBJV2ZIALC3AMDOEAuyAAgMADBRiIUpAAR7AGDIIyN4AISZABRG8lc88SuuEOcqAAB4mbI8uSQ5RYFbCC1xB1dXLh4ozkkXKxQ2YQJhmkAuwnmZGTKBNA/g88wAAKCRFRHgg/P9eM4Ors7ONo62Dl8t6r8G/yJiYuP+5c+rcEAAAOF0ftH+LC+zGoA7BoBt/qIl7gRoXgugdfeLZrIPQLUAoOnaV/Nw+H48PEWhkLnZ2eXk5NhKxEJbYcpXff5nwl/AV/1s+X48/Pf14L7iJIEyXYFHBPjgwsz0TKUcz5IJhGLc5o9H/LcL//wd0yLESWK5WCoU41EScY5EmozzMqUiiUKSKcUl0v9k4t8s+wM+3zUAsGo+AXuRLahdYwP2SycQWHTA4vcAAPK7b8HUKAgDgGiD4c93/+8//UegJQCAZkmScQAAXkQkLlTKsz/HCAAARKCBKrBBG/TBGCzABhzBBdzBC/xgNoRCJMTCQhBCCmSAHHJgKayCQiiGzbAdKmAv1EAdNMBRaIaTcA4uwlW4Dj1wD/phCJ7BKLyBCQRByAgTYSHaiAFiilgjjggXmYX4IcFIBBKLJCDJiBRRIkuRNUgxUopUIFVIHfI9cgI5h1xGupE7yAAygvyGvEcxlIGyUT3UDLVDuag3GoRGogvQZHQxmo8WoJvQcrQaPYw2oefQq2gP2o8+Q8cwwOgYBzPEbDAuxsNCsTgsCZNjy7EirAyrxhqwVqwDu4n1Y8+xdwQSgUXACTYEd0IgYR5BSFhMWE7YSKggHCQ0EdoJNwkDhFHCJyKTqEu0JroR+cQYYjIxh1hILCPWEo8TLxB7iEPENyQSiUMyJ7mQAkmxpFTSEtJG0m5SI+ksqZs0SBojk8naZGuyBzmULCAryIXkneTD5DPkG+Qh8lsKnWJAcaT4U+IoUspqShnlEOU05QZlmDJBVaOaUt2ooVQRNY9aQq2htlKvUYeoEzR1mjnNgxZJS6WtopXTGmgXaPdpr+h0uhHdlR5Ol9BX0svpR+iX6AP0dwwNhhWDx4hnKBmbGAcYZxl3GK+YTKYZ04sZx1QwNzHrmOeZD5lvVVgqtip8FZHKCpVKlSaVGyovVKmqpqreqgtV81XLVI+pXlN9rkZVM1PjqQnUlqtVqp1Q61MbU2epO6iHqmeob1Q/pH5Z/YkGWcNMw09DpFGgsV/jvMYgC2MZs3gsIWsNq4Z1gTXEJrHN2Xx2KruY/R27iz2qqaE5QzNKM1ezUvOUZj8H45hx+Jx0TgnnKKeX836K3hTvKeIpG6Y0TLkxZVxrqpaXllirSKtRq0frvTau7aedpr1Fu1n7gQ5Bx0onXCdHZ4/OBZ3nU9lT3acKpxZNPTr1ri6qa6UbobtEd79up+6Ynr5egJ5Mb6feeb3n+hx9L/1U/W36p/VHDFgGswwkBtsMzhg8xTVxbzwdL8fb8VFDXcNAQ6VhlWGX4YSRudE8o9VGjUYPjGnGXOMk423GbcajJgYmISZLTepN7ppSTbmmKaY7TDtMx83MzaLN1pk1mz0x1zLnm+eb15vft2BaeFostqi2uGVJsuRaplnutrxuhVo5WaVYVVpds0atna0l1rutu6cRp7lOk06rntZnw7Dxtsm2qbcZsOXYBtuutm22fWFnYhdnt8Wuw+6TvZN9un2N/T0HDYfZDqsdWh1+c7RyFDpWOt6azpzuP33F9JbpL2dYzxDP2DPjthPLKcRpnVOb00dnF2e5c4PziIuJS4LLLpc+Lpsbxt3IveRKdPVxXeF60vWdm7Obwu2o26/uNu5p7ofcn8w0nymeWTNz0MPIQ+BR5dE/C5+VMGvfrH5PQ0+BZ7XnIy9jL5FXrdewt6V3qvdh7xc+9j5yn+M+4zw33jLeWV/MN8C3yLfLT8Nvnl+F30N/I/9k/3r/0QCngCUBZwOJgUGBWwL7+Hp8Ib+OPzrbZfay2e1BjKC5QRVBj4KtguXBrSFoyOyQrSH355jOkc5pDoVQfujW0Adh5mGLw34MJ4WHhVeGP45wiFga0TGXNXfR3ENz30T6RJZE3ptnMU85ry1KNSo+qi5qPNo3ujS6P8YuZlnM1VidWElsSxw5LiquNm5svt/87fOH4p3iC+N7F5gvyF1weaHOwvSFpxapLhIsOpZATIhOOJTwQRAqqBaMJfITdyWOCnnCHcJnIi/RNtGI2ENcKh5O8kgqTXqS7JG8NXkkxTOlLOW5hCepkLxMDUzdmzqeFpp2IG0yPTq9MYOSkZBxQqohTZO2Z+pn5mZ2y6xlhbL+xW6Lty8elQfJa7OQrAVZLQq2QqboVFoo1yoHsmdlV2a/zYnKOZarnivN7cyzytuQN5zvn//tEsIS4ZK2pYZLVy0dWOa9rGo5sjxxedsK4xUFK4ZWBqw8uIq2Km3VT6vtV5eufr0mek1rgV7ByoLBtQFr6wtVCuWFfevc1+1dT1gvWd+1YfqGnRs+FYmKrhTbF5cVf9go3HjlG4dvyr+Z3JS0qavEuWTPZtJm6ebeLZ5bDpaql+aXDm4N2dq0Dd9WtO319kXbL5fNKNu7g7ZDuaO/PLi8ZafJzs07P1SkVPRU+lQ27tLdtWHX+G7R7ht7vPY07NXbW7z3/T7JvttVAVVN1WbVZftJ+7P3P66Jqun4lvttXa1ObXHtxwPSA/0HIw6217nU1R3SPVRSj9Yr60cOxx++/p3vdy0NNg1VjZzG4iNwRHnk6fcJ3/ceDTradox7rOEH0x92HWcdL2pCmvKaRptTmvtbYlu6T8w+0dbq3nr8R9sfD5w0PFl5SvNUyWna6YLTk2fyz4ydlZ19fi753GDborZ752PO32oPb++6EHTh0kX/i+c7vDvOXPK4dPKy2+UTV7hXmq86X23qdOo8/pPTT8e7nLuarrlca7nuer21e2b36RueN87d9L158Rb/1tWeOT3dvfN6b/fF9/XfFt1+cif9zsu72Xcn7q28T7xf9EDtQdlD3YfVP1v+3Njv3H9qwHeg89HcR/cGhYPP/pH1jw9DBY+Zj8uGDYbrnjg+OTniP3L96fynQ89kzyaeF/6i/suuFxYvfvjV69fO0ZjRoZfyl5O/bXyl/erA6xmv28bCxh6+yXgzMV70VvvtwXfcdx3vo98PT+R8IH8o/2j5sfVT0Kf7kxmTk/8EA5jz/GMzLdsAAAAgY0hSTQAAeiUAAICDAAD5/wAAgOkAAHUwAADqYAAAOpgAABdvkl/FRgAAIkFJREFUeNrsXQd4FFXXvpPey6aSQEJHIIQOoQhEBEQRwQKIiKiI9VN/FBQpolgQEAELgqAoNlRAQQEpCkgTSgChBggYOgFSSK/7fzd3diczO5vdyWayWe77PE8ys3fuvfXMvfe+954LhYVwVVjY4a8gLKz+ioDCZhYWdviJwkJYGBZ2+GsKC2FhWNjhryksLAMUrKHdWxcWFroiLCx8JbYxEP7N3t6+MzZnzI5du/Dxhx+iffv2xrA9eMg9cOV8iT++7N8f69atQ+vWrc1oT9Q4dOgQDh8+jFWrVhktMTnlrKysOvLgKCAg4AHyRmF2P5sNu7dYOXLNXU8IESs44u9iJcZt3L0h8Z+iBxe0atXKinT+j3AQ+xDrjAePjgbyfZrJ9+0tT8CIrLj7sDDkbWHCMOxjH/sY8q5+LU9QfPPNN2Y5hDlpdjUtLS3v8uXLGfHx8RkxMTFZqamp3MFNW1JSkj41NVWV3ePl5eXh6enp7O7u7uzu7u7SuHFjl/r167vUrFnTrXr16u6Ojo42YtUr/fSUycBLyMOQyYpMPR8fH2cxPfkWFhJaWlpaRUd8JT1OT0+36NrH7k6cOHHtiy+++Ktjx45/derUKSM+Pj42KSkpOSMj45YhVmdnZ6/atWs3qFWrVqM6deo0bNq0aeOGDRs2qVOnThOBJhsrx2JjY6+uXr36z6ioqD9dXV1tq1SpUt3f39+/Xr16/v7+/j7W1jVWY/X17OjoaCtQhzU1R+KVfk5PT8/6+++/Y2NjY6/Fx8ffuHTp0lW+p5SUlNutW7du3bJly607duwYt3z58r6HDh26dOjQocunT59OzONaQhOLk6QdJNUQvJfQQ1wFMhDhAGItsZswWNhC+JCwhjCWsNPa2tpeRKEq0IiihJ6E3oTOhNb8PSgpR/3bxMcLwhbCFsJWwjGEgze0s7NzBWEKoQNhGfYXq2A1QgvEBGQBgSKQJggkA0ECyf29/fz83FevXv0LlZOmVkS5MKS9ubi4OAjQXp7x5FNOCpn7R9JHSdOIGV8JEAiLCN8Lv8HKrBgYGBhNGEvYJPt5VoVBOjjlQCQMOUrYl4tjeSxO1qZnv6mOJ4R9grPG4Q3SgT+ryrDojOhA6E/oT3iPMJjQ3oCvT0t/czNSkk7z7n0tOvUXQKTn7bGEWOFhHsR/+xIGEVoKz7WfQGdM1v7yzzKdEi3JJhVFoIgFg+EgZLbkhQzNiCY7CZMLZsqG14Uw5iOjhVCBgGhDmCPoAn9hsD8i/EY4TDhKOEH4k3CNkEBIJGQQsgiZhAxCtszxtZ6enramp1KHTOfKzU3TPGP7L9QcCz+rq9c3GG+GgW+hNr4f9Nd6E0YThgoEaWZAm/5O2EM4QjhGOE74k3CFcINwnZBISBWcPZ1whZAp2OLZhCzxGUcY7gTm4GN4xjcSA8A8/9PK/yI0Fn5vLfgAIwtN5Pl7CVsJO8nYeBh5KHOE5uOxw3x8e7vGJCcn3xJOhOlCd+wjLKUDYsJJ0Jt41K1Hp9Aeo2YtUn7+8r5Qd3TQP5j0m5/fTYONQhthOeFSX8JYQkdp06hQ/UYa5L5ZfH6ZcJywjfAT4QfCFsJuwm+Ez4RHshb2mHnCHjOQ7y8R7vYr4fr/jfAD2y4b5W8y3o4RjvL9lOEE+5Z1w98Ixwi/CnOKdYTlwjP+m+31z8JnE4Qzak7Rq2xPUFHyLzgF3BZu/SnCAqGBdDGm2GhBgBY4bxrhJsFEHG2xHbPyJ06ckJKQEH9j//79F2NjY68LF1+aHu/r6xvUqFGjxg0bNmxct27d+n5+fq7/gzO7crTZJv2PfzIlJSUtISHhRnx8/PXExMSk2NjYhJiYmJuxsbE3b968eVu6OW1tbR2C3N39vLy8/LuOHBnw77//Zko3oaenZyAZAPfTLqON9q+/h5vhQbgWKSQMpvqYq8rKx9B9LylnazGZrDMo9VnG2rNnz/v33Xdfa2hn5LJhw4YOQtu3HTJkyMCJkyZNXLh48eKFy5YtW7x169YdBw8ePN6rV6/2gwYN6v7YY4+1atOmTetHHnmkZb169ZratGkDyJqVJiYntGjRAs2aNWtat25d/+bNmzdvxHe02BuZ+d/MqAeXoYE5T9eOj53s+U3Ly++yF3b3JEfIvjRhM+G/hNcJC4SnspzsjXsJ2YQ4whQ6IH0Iw4TxfYiMnJ+Fk8Mxwik6s+7wz08+DXhYczrGJM9mhPflmefWrd2A5b98jwXzFyAoMMgo47yUwFgR2vA42B73cHCOZT+2INwhPCxszosJi2WnQN6H/SiwM48kfqgdZZlrG6mtxNGlZctKLRs4tOvdr3CQBt0sZP6DBM72KPUn7CDMlFgIZI5OdqMG8uRaR9OZ2RqNGz8W6zatx4vPP4O9fwzF2jU/YNGi7/DUU+PQqeMj8POrBRsbW4M4MjfH6Bxaej9jfOJj2xQZbwJdRwq3ey/CWEJf3rQmbB45/fFJFUK0bLdJhVtRwgIy39nk25Lbk0zkSMJMYbvzN+1+XKVnJZAOBhA2CtmdWfSGjBOGKT2vEkdvSPgLNgODgxr3r9+Q8WJDByJfG0q4RJhAZ5tLI2QCoR/hJB1bLhPWCPuyIZvjhyqBQzjQvhTGYinpZwtj8jzfO8H4OqiSU0/3vd+FfVsh6T4lbI5xA3W7bTBLtBXbfRDhqOyEyJ6AhZJ/+wF+Z9mAQLQZuGHjWgwfNgy7/9iNTz75GGNGj0L//n3h5eVVhsrXj7vL5oGEX60OKRzwl4Q5YhLPl86v4j3TThp8/PrrDjXYC8rFJLZdWzpjDCGsI8ykOpklfHcRl4aN8XLhCM0WOjyHFz3j/l9VH0B5FnhTyNK5rPT/6vexhHGEKSy4bDAb1Qb+xc3y5sINbXCWxgLGiUbC7QGELoSu3Nz+0rT4V4EWOgXzuaOyKbEbGAMHbGfCZmHUFRO2EKazLUfyJLeYZzs+Eh7JBU3P/pKN7StO5qBww6qR5+OOCxkwPPY0vDO3WwXUkbNYANlE2CJm/9mw8SfQm/1nKpZf5fvL6LVIaFx7dpP2PnLEuHQ9FU72iLy/+Y6zQl7YKdKJh3+G8BEbPo6NmGJYU7G+yLjU5i8OTQiKVZ7rBGgmHLI2s+5VGnQLCIsJSxlvH0vvF2nTTZLR/0Ic/EE8+jzMNmv4/k9VrI1uT0+CzD9nRO6VYLOC8OI9Fl7hIrEgYxFhe6UWcWfJOFRh8D1MeEGYqVLOo0eeeOJJzJ07F1fPncHGdWuwes1qDB40EDY2Nkp9LCM1NjQ7y8kJaRQqJqTy7sRGjRjRFB2OHj32N6YAJgwz9v2MjFdQI4LyJTKE5sS7RjgHgdYNbeBgG8YbvoNuJPQQW1aV0YfNfE+OBOcwCQKF1gHdJAYNiS4tKLJ5D+YjHzfhPSG+fYkOAIfY2HuF9tjFtnNsJ5Ge+wLhO6pdJ+nJP8Xv4PNJwjvPFhqkzNP+lhj8vqF3Mho3Zm/CqB7RUtGIjRsKpMLZHGOJ7UlYLYze9YR1wi5qB2FC8KMq2tJY9dJ7HvRjbJaNYRs+YGFl9hOLCa6Eh20YJ6OTcVp6h3AOCLVMi4QnnxHNTjcyJg8Fj+CfcdKfFCb8oTSqfZZ8L2oq6p5cg+cKI/5DAo/K4/zpO6BVmzZ47PEnsHbdetTycEOjhgHwqumGWu6u8HBzQ8+5czD+7be5+VZJyOuv3+lHg6KjGKpCazJMjqpQiAHD+/FFOpK4sAfLfH6LwUF1w4QbLMgdkXLAinlOGKF+dCY8z7g4tN9OJ3UtFP0INwkJ/N+B8KhMeXiIz5zF8wE7F9Fw8VNiAe5CYfsaFEaOQBjYhjWtxIKL/bLRsFfCUjq/PBjQCLl95Lm7SkqTpE95jD7xdpT+Zq7nDPIAGPkm0/QV2sWGXOGl9JTq8Q9yGJmJUJpYjJHNYznYsJkqQ7ZOc8xLJ8pC7HzeDOGCz6ZT4v9LXg2HGdsGNe8BFkv3T9PWnbBJuK09aXz4Qbh51PFMX5pTT9JhAREMwJo11z1rVsPJ8TH7bI7sJLcnrKPq+BXbfiVjzUa+c4b8KhKKbEQmF6F1RCJNHwPWKFw8u18ONHJ83KRNW6xbtxZ9+/aCp4cr3n3nbbw64lVcvngBx48exYkT/+Dff//FyZMnce7cuarOOHlKjVdLmIpBIrxHgAWZbKE42XmxJ7+cqo/vBcUPzJNzOLCJhJOCo9J3MaKd9Xaiq5kOKMq+NZ7OdCHNdm8k5k1Kc7jK6Ai0A7DjdBz0xQ42+7MqPwqhRRgZS9BpZJUPnvv92Q7GWn0iDC3VKfIx8k/TCKtl6pOPgNOQtzOFXQq3k0G6cBsM6h8GbhADhfaP4oT7hNvpRKp8tz1H0zEMZ8Ak0LW4NMpOJ8RxnT+t0pNOANsJsYLzVIZsRLYLudH60zLp0jPj5FNGkzPG0AeA7R5PXgIxdrn9OEfOy9MZVwfTEfoW+4v4LMhB3sGYN5A1gUdYGJol3BTsJ5cRGVFHmQ/CJOjAuTCzOwGrCOv5flGJQCO4JnDBZDGHHYGX5/uh9L8YA+MIF8Q6gPZc4P1Y93Wba47s4GULRxMzaDNgM1IhOBFKtjl26BCOHNWgftL8eWLJjZLDRcxPGjNq8pfIqGQPCsNKYCPMhEwKJAY+O3FNb/7LIjCLU1U6lw7oJOuJJDKMuZreLLTJCOF2vSj8dko4KfDC/swlNIejBkOwRBYCJdX8WbDNzBYpfNepAGNXsNFLbOBQ2pQxgdlNWMHOuJBOwGz7OUZ5+F0IKKEeABdCNrEOIXRlfY4zsHPzWgOhCxn07GXZ7F9O+E64nc8yKF8SdgrOOZkS+aPCBHeMXZ4TBvF3tvOYNhXaO5/q14dOFcNQF3hK2lHgzn9GVkIkqoJPCc73zdiHviwi3S+wDhBu9k+EKL1u3Q4cPHgQI0e+jO+/+xYjX34Rx08cx6BBg/DGG2/il19+MbWmYBJnOiHBQGFfYGxBHFAcUgUYKcQ6xEuGZDJT2JHTDLZjgfNqiw6dH8Hw4cNhY2ODOXPm4Pz5c0V3CtS7WH2Vha2tPXJz83DnTrYd12uFOjM4vgd/3yYY2+0hThqb0FPLMwUFOLyKGNcOl2UThJcIZ1hZFGPfzQq3lbqJ0zAmm8WbjDGRb8R8QBf3yTIpP6PSJqpuI1x4V+l5zn9lZ6aHdRs9gLfefhfdOnej+nfuHDly5OBJe3sHnD9/Dps2bcJjjz2GIUOG4LnnnsPo0aPRv39/eHt7o3rVahYxYVJMLCO3f9vxsaDYJrr/Sy1K/bW9R9oKWFZkFOKI3YZzFTGJOhTgFtmb4FZfb1e0adceHTp0gLOzM9544w1MmfI+tm/fYeiZwgJhpkQ2zxs0SDfJuqwl0IwmOyj3BtqJ2v02ZEq8g/8L7R1Lb8x0OqYm8/YKF0KlCBALsKlDKJG/SMEPHNAdOdqG0T0sU2rWFdGP6tQmtq9Vv5gLN8l6Q3vOa5LIQdimZqNaZqrm1LGFhbQBFVDG3d+7jkK9whfhfECiJ5jXZz4GJqRPe0TnGi6CGUY4RucOUdcWA8m+TLkxdVq3xvjx4/H2229j8+bNePvtt7mKqlStYvGFFOeB8KsEaP/Jx3DvNatVUkSKsMBzNl+HCiHDJqCdKNEGwKnWx6wV1Ka6Zk9H3YceegjvvPMOVqxYgQsXLuDRRx+FjY2tONdIQw1E7zCBfZUKgG18Q9Xf6qE1rBbr9VDhCbcX2aH4BfPJNNKQ5xj/5xMWMRZtF97nXCQ/YGt8IPiDPCrEyQyCOfG5LfvCIU7CvVh8GirzOXBhzO7EOgmPLx6jlh4lPQutjqHhNP1Qf05kCmXOCkfDJowJO6my8/o72kSZJmRK6lQjVB4rCdklJSMJbdu0Q59+fR8gpyVLEhCShk9v4n2nKqKQLtSSINqgjtJJL8JpTy5GZGOkVbJeqWQfKsWJYnFqJBKOGXKzqSQ9I9GzKOe0GzZsWB/hg/6cJGIeUCNBfE/Mzh3FJ6YCd04ey0hPTYl7/sXRGLtwfpUnWOhNYOi2iUJhbgVNqhJj5I/RO+7CWRYczjGGnyIMRlrCIWGvF6FfDGIBJfKIJITjLLwcfYj8Uo8gH3ZEluPQlV0YUJNqWVOYm/DDpBqfSSTLJ/7LdkAcUyQ6rRjcPpuR7QhtFJkDbgdI5/Y1bUHfKZT7NmV7B3G9sJkOPY6kClGTvfr0RcfOnZCQkAAvLy+tGJcvyVCKAX7LGqvjSLCeXIGGzfIEiTzJhwZOYZQW8kpJWlRHHOj8xHmU8L/LhMlCvwYW0f3DnP2xO/YcdTw/bgFOg4K4wY4c6e26YsUKQ+BoQ6aPjNKT7xhYNK6ycaOeOhQDo2fPnkOeeOLJxLj4mPMVZpI3RGFSLa4jTLDEGhfTlxV4LQ4H4Ss6R3FqrjG7VlrcTZvH0qSzfKKsHa1FS66TpEIBOOeO4zJJsOe6ZZGc+zWnykuGGFW9kUEH4+3CHRvGFH8aGHpA3BYbv6LFe9QfRJtfKfv2j8J6yPAipLBqD1rCLdqEzP9jZFq2dWCNhKTl2TpKOmLt7R3Qvv1DGDlyJNatW4f33nvP5DlFapBKW2R5k2J6cS8QEe4Y4+YYqKSPKkTQe8W8Z/8JNKG6rkRTkbw8S4JRQhNNvU2bNhg4cCA+/PBDbN68Gb1796F7tZOhSYDV8lAmqW/mK7vNTGQ8m24sDgfxvvEJMIeNWJwGJWt4KWF5t0WfPnP7+PqOOH78uMLOdlXy8ptOIqQcMpT6DsXcIu6xkJmRNm367LOZ9B++QXWA3G6iFrNnPjOVhYIYPx6X8WNfhHMBx0V1jKrSbE6GGgKGCCF1cTwW88J5aLbU5MJKJKcZOlaPMD6K8c5H+ZzjYo6OYvHPsiBm8AhH0Z4rCeOnZ+qKfCDpnQ/SHOtlkwj9y8xc2Y1QvZPz+8SRYnbXGpqKfNOJa8SfpF3d2Uj4YPnyZXj00UexZMkSs3UgM8hFDZlbD6LFzHhWz+F8SFvvYCzjqLovJ3Kla7hCQhaTBjL9WZ6Z0oOCJYe92NcjBw0YkL5k6VLl0YHAZxXj1VSmRSNLaFqUdwP1R2uqfYt1fBwk6A1eTfC+0ePGBTz66Fhcv3wJT/ftpzlX7O8nVPQo3bOUJHGx1OfGjANbJfQTqKSITqQlXlFHDh86lCNs+qL2LmBqyPuJgaTwGvqH1qfyPCBaQ4z8jHfJSp3RgxBcFAMQxOdmUfXnpMz+2wbPQCBDkkB6a4wGISM8jGwQ+JxqQPz7ZIEQnwUeUxE3/8Y3Q1jDJcaFfxk7r/E5Ql8O5xKT+b9Y5t5dJyS5NNhsIIhMUZ7KI7QLZzh2KVHdY9DI/BLNHANOYwKEnS8v72pqd3KrNtdjXrt2Ldy8fOAWVBs2jo4IDQ1Bu3YPYcOGDVi/fj169OiBjz76CE8++SQ8PT31VLEo5RWK10WwIXQqEy92g3WYJTdkPJgibOuiCOcsJrWMLjK3hUOjRo3Rtm1beHp6csUajaKcTB37JHEOxtFyLV+wAAO++hp77rY1ikjJLf1aYqN6hqKwKE2BQVVaTGPkU21WOKOSwLSC7Cgo/WYBh3zfqHuSl1L7TwkGQlNbOVWnJi3kWF5iHqBfpFKO5MHTJdMM+QaQ11sKN9s6wSjgZ4X4SQjGE3eT99Jhw5n7v7fTgO30oOCIgGlj57HjJtLw5xb+8/WEGTzKbRnwqOsFPdNflM6DJROKj9eBp7xKPfJE8PFYzxOAYOFp9hOqY1m6mLZ3F3O38UUOH6rRs9apU6dSHRgaGkrm4Jw5c7B//35MnjwZW7duLTVuL168GG+//TaWLVuGzz//HK+++ireeustbNiwAampqQa3+EplCnMiSQZ0LVPb+BLrvjw1FxoHT3Eah6mxz7bq9PCDBw8elHNgY1IZKGzJrIr6kLGvuiRKagYjOPTTSmfAx6YGHy7YsCG9Xr16NVauXIm3334bEyZMwKRJk7By5Uq8+eabGDt2LBo0aKC3k8Soe4FHs2YaJNNhQKwjUCOdGR6/TehDCGGjGVIMnJNdZQWyKOqSXWhsnkCh8j+fHWQaXQNPMgZsJhOSy7zdwg0dLhz7bSZD9iJJp8XHXS0IW8S7lA7mh4VHsIjQl3CQrO6v0ONoHZM7zfD9pnTWWF4Nv7cZqQ6sJ8Kd4sBGJoNyW8Rz+kKhMvEFhGGCIeJ79PAo9Bb7L5YdF0u8LzLOqYV+lBaM39Xj+y9w7mIDfQPe4mh5s4xZ5sIL0zqN+eQdjZDPfcJU3qW9s0LDqhMz7tKelLKOGkcKLCMXWEfpJWwVZf+yGYefI+xnP6YzFqzkaH6TdZFrBOdJojOJGwnf89ltYuxawPdPCHONREJzwl7Cpop0/kYLu3Pr7RJhB7NJSgM4uRCPyO1DkMG6eDkVjfvRwbFMLI6WuwqfOI0V3yQvfYnTZgw5iE9KYzjXQ6ZLl35CdNJ1tAVfkLLJjAQq3IqFc2l2gLAMJBLlwKAqtZi+XC0JJ2OZuO8FDq8mHNOQu2+5Z0pK8o03J02c9FzTps36xsbG/mPmIklBmMEYLzLhSJmxdLEsR8aNjdXAaXhTnrmGxfJcG0ZfEa0h0Zeh+4Iq7BZKqSNMjH8ksVLJ/zfhh4BG+z7c7v8Kd+8LWJZWTDhAZsz5hKNCOdwPnLNyBhqnWRkJoOy/Iz8HfUhYKKwb9mL9GCOzMVcrJjGd5oQptKPSF0zBDT4/C7tPDrPtWVhLlDGwDqWPgPXJD4Qf+A7VxR06TGAGnHI5fZvxO1y+3hxvIf0Urn3MJhOqbByNb9Cjpy6+W4Vp4A5c36h0VYY6FXPYPxXJnmvPXgE0ItawYxgf9qTzf1rnKIFBx6JR/7fgEOYrzxIOrR6wRdEqNT1zbDa1ZLvMjJxYdKIWrV8l5hOwVhGOGJx7W1sTKQEe5/l7WrZsiZdeegldu3aFu3slOOBl6jW6ChVWO5Gr8YKzZQZWpg0rw4aVp6KgfOSFhRUPilVuV9Vxrqz9KZ1vq0w7VobdKkOqtRAQVKa9LawMFbTcKkOvlKv1CwsrPqhcNXa5afoyCCtXLS+oIKgMO1eGiqWgPPxfZdi5Mr1CZVzAkv5fy89fWFh5hAU0RmHlChsrjJrCwnJAZdiq8lP4ZlSGnStPZlKFhU8WKsOu5Xkdy/8LViXSKUJhYWGFFz//A4PDbX9nz0pnAAAAAElFTkSuQmCC" 
            alt="Minechat AI" 
            className="w-8 h-8 object-contain"
          />
          <span className="text-xl font-bold text-gray-900 dark:text-white">minechat.ai</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          if (item.children) {
            return (
              <Collapsible key={item.name} open={setupOpen} onOpenChange={setSetupOpen}>
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className={`w-full justify-start space-x-3 ${
                      location.startsWith("/setup") ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                    <ChevronDown className="w-4 h-4 ml-auto" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="ml-6 mt-2 space-y-1">
                  {item.children.map((child) => (
                    <Link key={child.name} href={child.href}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`w-full justify-start ${
                          isActive(child.href) ? "bg-gray-50 text-gray-900" : "text-gray-600 hover:text-gray-900"
                        }`}
                      >
                        {child.name}
                      </Button>
                    </Link>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          }

          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={`w-full justify-start space-x-3 ${
                  isActive(item.href) ? "bg-gray-100 text-gray-900" : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.name}</span>
              </Button>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-200">
        <Button
          variant="ghost"
          className="w-full justify-start space-x-3 text-red-600 hover:bg-red-50 hover:text-red-700"
          onClick={() => window.location.href = '/api/logout'}
        >
          <LogOut className="w-4 h-4" />
          <span>Logout</span>
        </Button>
      </div>
    </div>
  );
}
