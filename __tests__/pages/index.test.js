import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Home from "@/pages/index";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from 'next/router';

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}));

// Mock the useAuth hook
jest.mock("@/context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

describe("Home Page Input Handling", () => {
  beforeEach(() => {
    // Mock a logged in user
    useAuth.mockImplementation(() => ({
      user: { id: 'test-user' },
      session: { access_token: 'test-token' },
      loading: false,
    }));

    // Mock router implementation
    useRouter.mockImplementation(() => ({
      push: jest.fn(),
    }));
  });

  it("should update topic state when input changes", async () => {
    render(<Home />);
    const topicInput = screen.getByPlaceholderText("Enter a topic to learn about...");
    await userEvent.type(topicInput, "React testing");
    expect(topicInput.value).toBe("React testing");
  });

  it("should update experience state when textarea changes", async () => {
    render(<Home />);
    const experienceInput = screen.getByPlaceholderText(/Tell us about your experience/);
    await userEvent.type(experienceInput, "I have some experience");
    expect(experienceInput.value).toBe("I have some experience");
  });

  it("should update timeline state when input changes", async () => {
    render(<Home />);
    const timelineInput = screen.getByPlaceholderText(/How much time do you have/);
    await userEvent.type(timelineInput, "2 weeks");
    expect(timelineInput.value).toBe("2 weeks");
  });

  it("should enable submit button when topic is filled", async () => {
    render(<Home />);
    const topicInput = screen.getByPlaceholderText("Enter a topic to learn about...");
    const submitButton = screen.getByRole("button", { name: /Generate Learning Plan/ });

    await userEvent.type(topicInput, "React testing");
    expect(submitButton).not.toBeDisabled();
  });

  it("should allow submission with optional fields empty", async () => {
    render(<Home />);
    const topicInput = screen.getByPlaceholderText("Enter a topic to learn about...");
    const submitButton = screen.getByRole("button", { name: /Generate Learning Plan/ });

    await userEvent.type(topicInput, "React testing");
    expect(submitButton).not.toBeDisabled();
  });

  it("should show error message when submission fails", async () => {
    // Mock fetch to return error
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Test error" }),
      })
    );

    render(<Home />);
    
    // Fill out form
    const topicInput = screen.getByPlaceholderText("Enter a topic to learn about...");
    const experienceInput = screen.getByPlaceholderText(/Tell us about your experience/);
    const timelineInput = screen.getByPlaceholderText(/How much time do you have/);
    const submitButton = screen.getByRole("button", { name: /Generate Learning Plan/ });

    await userEvent.type(topicInput, "React testing");
    await userEvent.type(experienceInput, "Some experience");
    await userEvent.type(timelineInput, "2 weeks");
    await userEvent.click(submitButton);

    // Check for error message
    const errorMessage = await screen.findByText("Test error");
    expect(errorMessage).toBeInTheDocument();
  });
});
