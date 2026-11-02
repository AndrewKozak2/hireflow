import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Navbar } from "./Navbar";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";

vi.mock("@mantine/core", () => {
  return {
    Stack: ({ children }) => <div>{children}</div>,
    NavLink: ({ label, onClick }) => <div onClick={onClick}>{label}</div>,
    Box: ({ children, className }) => (
      <div className={className}>{children}</div>
    ),
    Title: ({ children }) => <h1>{children}</h1>,
    Group: ({ children, justify }) => (
      <div style={{ display: "flex", justifyContent: justify }}>{children}</div>
    ),
    Text: ({ children }) => <span>{children}</span>,
    Avatar: ({ children }) => <div>{children}</div>,
    ActionIcon: ({ children, onClick }) => (
      <button onClick={onClick}>{children}</button>
    ),
    Tooltip: ({ children, label }) => <div title={label}>{children}</div>,
    MantineProvider: ({ children }) => <div>{children}</div>,
  };
});

vi.mock("@tabler/icons-react", () => ({
  IconLogout: () => <span>LogoutIcon</span>,
}));

const logoutMock = vi.fn();
vi.mock("../../hooks/useAuth", () => ({
  useAuth: () => ({ logout: logoutMock }),
}));

vi.mock("../../stores/useAuthStore", () => ({
  useAuthStore: (selector) =>
    selector({
      user: { name: "Test User", role: "ADMIN" },
    }),
}));

vi.mock("../../constants/navigation", () => ({
  NAVIGATION_LINKS: [
    {
      path: "/home",
      label: "Home",
      allowedRoles: ["USER", "ADMIN"],
      icon: () => null,
    },
  ],
}));

vi.mock("../../utils/authUtils", () => ({
  hasAccess: () => true,
}));

const renderNavbar = () => {
  return render(
    <MemoryRouter>
      <Navbar />
    </MemoryRouter>,
  );
};

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should render navigation links", () => {
    renderNavbar();
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("should render user name", () => {
    renderNavbar();
    expect(screen.getByText("Test User")).toBeInTheDocument();
  });

  it("should render logout button", () => {
    renderNavbar();
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("should call logout when button clicked", async () => {
    const user = userEvent.setup();
    renderNavbar();

    const btn = screen.getByRole("button");
    await user.click(btn);

    expect(logoutMock).toHaveBeenCalled();
  });
});
