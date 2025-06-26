import { Outlet } from "react-router-dom"
import Header from "../components/Header"
import Sidebar from "../components/Sidebar"

const Layout: React.FC = () => {
    return (
        <div className="flex w-full">
            <Sidebar />
            <div className="flex-1 w-full overflow-hidden">
                <Header />
                <Outlet />

            </div>
        </div>
    )
}

export default Layout