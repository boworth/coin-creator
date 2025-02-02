import { render, fireEvent, waitFor } from "@testing-library/react"
import { Membership } from "./Membership"
import { useMembership } from "@/contexts/membership-context"
import { useWallet } from "@solana/wallet-adapter-react"
import { sendSolPayment } from "@/lib/solana-pay"

// Mock the necessary dependencies
jest.mock("@/contexts/membership-context")
jest.mock("@solana/wallet-adapter-react")
jest.mock("@/lib/solana-pay")

describe("Membership Component", () => {
  beforeEach(() => {
    ;(useMembership as jest.Mock).mockReturnValue({
      isActive: false,
      activateMembership: jest.fn(),
    })
    ;(useWallet as jest.Mock).mockReturnValue({
      connected: true,
      publicKey: { toBase58: () => "mock-public-key" },
      signTransaction: jest.fn(),
    })
    ;(sendSolPayment as jest.Mock).mockResolvedValue("mocked-transaction")
  })

  it("should render membership options", () => {
    const { getByText } = render(<Membership />)
    expect(getByText("Weekly Membership")).toBeInTheDocument()
    expect(getByText("Monthly Membership")).toBeInTheDocument()
  })

  it("should open payment dialog on button click", async () => {
    const { getByText } = render(<Membership />)
    fireEvent.click(getByText("Activate Monthly Membership"))
    await waitFor(() => {
      expect(getByText("Choose Payment Method")).toBeInTheDocument()
    })
  })

  it("should process SOL payment when selected", async () => {
    const { getByText } = render(<Membership />)
    fireEvent.click(getByText("Activate Monthly Membership"))
    await waitFor(() => {
      fireEvent.click(getByText("Pay with SOL"))
    })
    expect(sendSolPayment).toHaveBeenCalled()
  })
})

