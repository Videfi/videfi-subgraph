import { App, ContentNFT, User } from "../generated/schema";
import { Transfer } from "../generated/templates/VidefiContent/VidefiContent";
import { Address, BigInt } from "@graphprotocol/graph-ts";
import { getOrCreateContent } from "./videfiContentDeployer";

const APP_ID = "app";

export function handleTransferEvent(event: Transfer): void {
  if (event.params.from == new Address(0)) {
    handleMint(event);
  } else {
    handleTransfer(event);
  }
}

function handleMint(event: Transfer): void {
  const nftAddress = event.transaction.to;
  const id = nftAddress!.toHex() + "-" + event.params.tokenId.toString();

  let app = getOrCreateApp();
  let owner = getOrCreateUser(event.params.to);
  let content = getOrCreateContent(event.params.to);

  let contentNFT = new ContentNFT(id);
  contentNFT.content = content.id;
  contentNFT.owner = owner.id;

  owner.totalContents = owner.totalContents.plus(BigInt.fromI32(1));
  app.totalContents = app.totalContents.plus(BigInt.fromI32(1));

  owner.save();
  app.save();
  contentNFT.save();
}

function handleTransfer(event: Transfer): void {
  const nftAddress = event.transaction.to;
  const id = nftAddress!.toHex() + "-" + event.params.tokenId.toString();

  let oldOwner = getOrCreateUser(event.params.from);
  let newOwner = getOrCreateUser(event.params.to);

  let contentNFT = ContentNFT.load(id);

  if (contentNFT) {
    contentNFT.owner = newOwner.id;

    oldOwner.totalContents = oldOwner.totalContents.minus(BigInt.fromI32(1));
    newOwner.totalContents = newOwner.totalContents.plus(BigInt.fromI32(1));

    newOwner.save();
    oldOwner.save();
    contentNFT.save();
  }
}

export function getOrCreateUser(id: Address): User {
  let user = User.load(id.toHex());
  if (user == null) {
    user = new User(id.toHex());
    user.totalContents = BigInt.fromI32(0);
    user.save();
  }
  return user;
}

export function getOrCreateApp(): App {
  let app = App.load(APP_ID);
  if (app === null) {
    app = new App(APP_ID);
    app.totalContents = BigInt.fromI32(0);
    app.save();
  }
  return app;
}
