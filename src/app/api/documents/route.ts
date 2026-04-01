import { NextRequest, NextResponse } from 'next/server';
// import { renderContract } from '@/templates/contract-fr-en';
// import { renderInvoice } from '@/templates/invoice';

/**
 * POST /api/documents — Generate a document (contract, invoice, etc.)
 * pre-filled with the user's business profile data.
 */

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { documentType, data } = body;

  if (!documentType) {
    return NextResponse.json(
      { error: 'documentType is required' },
      { status: 400 }
    );
  }

  // TODO: Switch on documentType and call the appropriate template renderer
  // const rendered = documentType === 'contract' ? renderContract(data) : renderInvoice(data);

  return NextResponse.json({
    message: `Document generation stub for type: ${documentType}`,
    documentType,
    content: '<!-- Stub document content -->',
  });
}
