"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

const faqItems = [
  {
    question: "What is a Solana token?",
    answer:
      "A Solana token is a digital asset created on the Solana blockchain. It can represent anything from a cryptocurrency to a loyalty point or a voting right in a decentralized organization.",
  },
  {
    question: "How much does it cost to create a token on Solana?",
    answer:
      "The cost to create a token on Solana is relatively low compared to other blockchains. You'll need to pay a small fee in SOL for the transaction that creates your token. The exact amount can vary but is typically less than 1 SOL.",
  },
  {
    question: "What is token supply?",
    answer:
      "Token supply refers to the total number of tokens that will exist for your project. You can choose to create a fixed supply or implement a mechanism for minting additional tokens later.",
  },
  {
    question: "What are token decimals?",
    answer:
      "Token decimals determine the divisibility of your token. For example, if you set 2 decimals, the smallest unit of your token will be 0.01. Most tokens use 9 decimals, similar to SOL.",
  },
  {
    question: "Can I change my token's metadata after creation?",
    answer:
      "By default, token metadata can be changed after creation. However, you can choose to make your token's metadata immutable during the creation process, which prevents any future changes.",
  },
  {
    question: "What is mint authority?",
    answer:
      "Mint authority is the ability to create new tokens after the initial supply is minted. The account with mint authority can increase the total supply of tokens at any time.",
  },
  {
    question: "What is freeze authority?",
    answer:
      "Freeze authority allows an account to freeze token accounts, preventing transfers of the token. This can be useful for regulatory compliance or security measures.",
  },
  {
    question: "Do I need a Solana wallet to create a token?",
    answer:
      "Yes, you need a Solana wallet to create a token. The wallet is used to sign the transaction that creates the token and to pay the associated fees.",
  },
]

export function FAQAccordion() {
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqItems.map((item, index) => (
        <AccordionItem key={index} value={`item-${index}`}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  )
}

