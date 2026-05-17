import { createBrowserRouter } from "react-router";

import { MembersView } from "./views/Members";
import { HomeView } from "./views/Home";
import Layout from "./Layout";
import { LockersView } from "./views/Lockers";
import { SportsView } from "./views/Sports";
import { DisciplinesView } from "./views/Disciplines";
import { MedicalCertificatesView } from "./views/MedicalCertificates";
import { PaymentsView } from "./views/payments";

export let router = createBrowserRouter([
  {
    Component: Layout,
    children: [
      {
        path: "/",
        Component: HomeView,
      },
      {
        path: "/members",
        Component: MembersView,
      },
      {
        path: "/lockers",
        Component: LockersView,
      },
      {
        path: "/sports",
        Component: SportsView,
      },
      {
        path: "/disciplines",
        Component: DisciplinesView,
      },
      {
        path: "/medical-certificates",
        Component: MedicalCertificatesView,
      },
      {
        path: "/payments",
        Component: PaymentsView,
      }
    ],
  },
]);
