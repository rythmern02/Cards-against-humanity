import { NextRequest, NextResponse } from "next/server";
import {
  createActionHeaders,
  ActionError,
  ActionPostResponse,
  createPostResponse,
  MEMO_PROGRAM_ID,
} from "@solana/actions";
import {
  clusterApiUrl,
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
  TransactionInstruction,
} from "@solana/web3.js";
MEMO_PROGRAM_ID;

// Set up headers, including CORS
const headers = createActionHeaders();

export const GET = async () => {
  return NextResponse.json({ message: "Method not supported" } as ActionError, {
    status: 403,
    headers,
  });
};

export const OPTIONS = async () => NextResponse.json(null, { headers });

export const POST = async (req: NextRequest) => {
  try {
    const { searchParams } = req.nextUrl;
    const account = searchParams.get("account") || ""; // User's public key
    const task = searchParams.get("task") || ""; 
    const choice = searchParams.get("choice") || ""; 
    console.log(account, "this is the signature: ");
    const sender = new PublicKey(account);
    console.log("Sender's public key:", sender);

    const connection = new Connection(clusterApiUrl("mainnet-beta"));
    let amount = 0.001;
    let toPubkey = new PublicKey(
      "8SM1A6wNgreszhF8U7Fp8NHqmgT8euMZFfUvv5wCaYfL"
    );

    let message = `Task: ${task}, Rated: ${choice} `;

    // Memo instruction to include a message
    const memoInstruction = new TransactionInstruction({
      keys: [],
      programId: new PublicKey(MEMO_PROGRAM_ID), // Using the MEMO_PROGRAM_ID
      data: Buffer.from(message), // Convert the message string to a Buffer
    });

    const transferSolInstruction = SystemProgram.transfer({
      fromPubkey: sender, // Corrected here
      toPubkey: toPubkey,
      lamports: amount * LAMPORTS_PER_SOL,
    });

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash();

    const transaction: any = new Transaction({
      feePayer: sender, // Corrected here
      blockhash,
      lastValidBlockHeight,
    }).add(transferSolInstruction, memoInstruction);


    const payload: ActionPostResponse = await createPostResponse({
      fields: {
        type: "transaction",
        transaction: transaction,
      },
    });

    return NextResponse.json(payload, { headers });
  } catch (err) {
    console.error("Error in POST /api/actions:", err);

    let actionError: ActionError = { message: "An unknown error occurred" };
    if (typeof err === "string") actionError.message = err;
    else if (err instanceof Error) actionError.message = err.message;

    return NextResponse.json(actionError, {
      status: 400,
      headers,
    });
  }
};
