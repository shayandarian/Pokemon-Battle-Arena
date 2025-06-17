const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Pokemon Battle Game", function () {
  let token;
  let pokemon;
  let battle;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    [owner, addr1, addr2] = await ethers.getSigners();

    const Token = await ethers.getContractFactory("Token");
    token = await Token.deploy();
    await token.deployed();

    const Pokemon = await ethers.getContractFactory("Pokemon");
    pokemon = await Pokemon.deploy();
    await pokemon.deployed();

    const Battle = await ethers.getContractFactory("Battle");
    battle = await Battle.deploy(pokemon.address);
    await battle.deployed();

    await token.setBattleContract(battle.address);
    await token.addAuthorizedMinter(battle.address);
  });

  describe("Token", function () {
    it("Should have correct initial supply", async function () {
      expect(await token.totalSupply()).to.equal(ethers.utils.parseEther("1000000"));
    });

    it("Should allow battle contract to mint tokens", async function () {
      await token.connect(battle.signer).mint(addr1.address, ethers.utils.parseEther("10"));
      expect(await token.balanceOf(addr1.address)).to.equal(ethers.utils.parseEther("10"));
    });
  });

  describe("Pokemon", function () {
    it("Should mint a new Pokemon", async function () {
      await pokemon.mintPokemon(addr1.address, 1);
      const pokemonData = await pokemon.getPokemon(1);
      expect(pokemonData.pokemonId).to.equal(1);
      expect(pokemonData.level).to.equal(1);
    });

    it("Should not allow more than 3 Pokemon per user", async function () {
      await pokemon.mintPokemon(addr1.address, 1);
      await pokemon.mintPokemon(addr1.address, 2);
      await pokemon.mintPokemon(addr1.address, 3);
      await expect(pokemon.mintPokemon(addr1.address, 4)).to.be.revertedWith(
        "Maximum 3 Pokemon per user"
      );
    });
  });

  describe("Battle", function () {
    beforeEach(async function () {
      await pokemon.mintPokemon(addr1.address, 1);
      await pokemon.mintPokemon(addr2.address, 2);
    });

    it("Should allow Pokemon to battle", async function () {
      await battle.connect(addr1).battle(1, 2);
      const stats = await battle.getUserStats(addr1.address);
      expect(stats.totalBattles).to.equal(1);
    });

    it("Should not allow battling own Pokemon", async function () {
      await expect(battle.connect(addr1).battle(1, 1)).to.be.revertedWith(
        "Cannot battle your own Pokemon"
      );
    });
  });
}); 