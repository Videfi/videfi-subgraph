import { ContentCreated } from "../generated/VidefiContentDeployer/VidefiContentDeployer";
import { ERC20 } from "../generated/VidefiContentDeployer/ERC20";
import { VidefiContent } from "../generated/templates/VidefiContent/VidefiContent";
import { VidefiContent as VidefiContentDataSource } from "../generated/templates";
import { Beneficiary, Content, ContentNFT, Token } from "../generated/schema";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { getOrCreateApp, getOrCreateUser } from "./videfiContent";

export function handleContentCreated(event: ContentCreated): void {
  let content = getOrCreateContent(event.params.content);
  VidefiContentDataSource.create(event.params.content);
  createFirstNFT(content);
  content.save();
}

export function getOrCreateContent(id: Address): Content {
  let content = Content.load(id.toHex());

  if (content == null) {
    content = new Content(id.toHex());

    let instance = VidefiContent.bind(id);
    let contentName = instance.try_name();
    let contentSymbol = instance.try_symbol();
    let tokenURI = instance.try_tokenURI(BigInt.fromI32(0));
    let limitAmount = instance.try_limitAmount();
    let paymentToken = instance.try_paymentToken();
    let mintPrice = instance.try_mintPrice();
    let beneficiary = instance.try_beneficiary();
    let isDAOBeneficiary = instance.try_isDAOBeneficiary();

    if (!contentName.reverted) {
      content.contentName = contentName.value;
    }
    if (!contentSymbol.reverted) {
      content.contentSymbol = contentSymbol.value;
    }
    if (!tokenURI.reverted) {
      content.tokenURI = tokenURI.value;
    }
    if (!limitAmount.reverted) {
      content.limitAmount = limitAmount.value;
    }
    if (!paymentToken.reverted) {
      content.paymentToken = getOrCreateToken(paymentToken.value).id;
    }
    if (!mintPrice.reverted) {
      content.mintPrice = mintPrice.value;
    }
    if (!beneficiary.reverted) {
      let beneficiaryData = getOrCreateBeneficiary(beneficiary.value);
      content.beneficiary = beneficiaryData.id;
      beneficiaryData.totalContents = beneficiaryData.totalContents.plus(
        BigInt.fromI32(1)
      );
      beneficiaryData.save();
    }
    if (!isDAOBeneficiary.reverted) {
      content.isDAOBeneficiary = isDAOBeneficiary.value;
    }

    content.save();
  }
  return content;
}

export function createFirstNFT(content: Content): void {
  const nftAddress = content.id;
  const id = nftAddress + "-" + "0";

  let app = getOrCreateApp();
  let owner = getOrCreateUser(Address.fromString(nftAddress));

  let contentNFT = new ContentNFT(id);
  contentNFT.content = content.id;
  contentNFT.owner = owner.id;

  owner.totalContents = owner.totalContents.plus(BigInt.fromI32(1));
  app.totalContents = app.totalContents.plus(BigInt.fromI32(1));

  owner.save();
  app.save();
  contentNFT.save();
}

export function getOrCreateBeneficiary(id: Address): Beneficiary {
  let beneficiary = Beneficiary.load(id.toHex());
  if (beneficiary == null) {
    beneficiary = new Beneficiary(id.toHex());
    beneficiary.totalContents = BigInt.fromI32(0);
    beneficiary.save();
  }
  return beneficiary;
}

export function getOrCreateToken(id: Address): Token {
  let token = Token.load(id.toHex());
  if (token == null) {
    token = new Token(id.toHex());

    let instance = ERC20.bind(id);
    let symbol = instance.try_symbol();
    let name = instance.try_name();
    let decimals = instance.try_decimals();

    if (!symbol.reverted) {
      token.symbol = symbol.value;
    }
    if (!name.reverted) {
      token.name = name.value;
    }
    if (!decimals.reverted) {
      token.decimals = BigInt.fromI32(decimals.value);
    }

    token.save();
  }
  return token;
}
