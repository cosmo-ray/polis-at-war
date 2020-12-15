let CARD_W = 200
let CARD_H = 300

function i_at(paw, k)
{
    return yeGetInt(yeGet(paw, k))
}

function paw_action(paw, eves)
{
    let mouse_r = ywRectCreateInts(yeveMouseX(), yeveMouseY(), 1, 1)
    var p0 = yeGet(paw, "p0")
    var p0d = yeGet(p0, "deck")
    var p0h = yeGet(p0, "hand")
    var p1 = yeGet(paw, "p1")

    if (yevCheckKeys(eves, YKEY_MOUSEDOWN, 1) &&
	ywCanvasCheckColisionsRectObj(mouse_r, yeGet(p0, "deck_c"))) {
	yePushBack(p0h, yeLast(p0d), yeLastKey(p0d))
	yePopBack(p0d)
	print("draw a card !!!", yeLen(p0d), yeLen(p0h),
	      yeLastKey(p0d), yeLastKey(p0h))
    }
}

function mk_card_back(father, name)
{
    let sz = ywSizeCreate(CARD_W, CARD_H)
    let ret = ywTextureNew(sz, father, name)

    ywTextureMergeRectangle(ret, 0, 0, CARD_W, CARD_H, "rgba: 127 30 70 255")
    ywTextureMergeText(ret, 30, 130, CARD_W, 30, "Polis At War")
    return ret
}

/*
m * This function should be callable from outside of the module
 * Take a card description and return create image in it
 */
function mk_card(card, card_name)
{
    let sz = ywSizeCreate(CARD_W, CARD_H)
    let imd_dst = ywRectCreateInts(25, 40, 150, 150)
    let imd_src = null
    var ret = ywTextureNew(sz, card, "texture")
    var gc_crasp = yeCreateArray()
    let img_path = card_name + ".png"

    print(img_path)
    ywTextureMergeRectangle(ret, 0, 0, ywSizeW(sz), ywSizeH(sz),
			    "rgba: 127 127 127 255")

    ywTextureMergeText(ret, 0, 0, CARD_W, 30, card_name)
    var itxt = ywTextureNewImg(img_path, null, gc_crasp, null)
    ywTextureMergeTexture(itxt, ret, imd_src, imd_dst)
    return ret
}

function create_player(paw, name, deck)
{
    var p = yeCreateArray(paw, name)

    var p_deck = yeCreateArray(p, "deck")
    yeCreateArray(p, "hand")
    yeCreateArray(p, "graveyard")
    yeCreateArray(p, "field")

    var cards = yeGet(paw, "cards")
    var cp_deck = yeCreateCopy(deck)
    var tot_cards = 0
    for (i = 0; i < yeLen(cp_deck); ++i) {
	var cards_nb = yeGet(cp_deck, i)
	tot_cards += yeGetInt(cards_nb)
    }

    while (tot_cards > 0) {
	var deck_idx = yuiRand() % yeLen(cp_deck)
	var cards_nb = yeGet(cp_deck, deck_idx)

	if (yeGetInt(cards_nb) > 0) {
	    let cname = yeGetKeyAt(cp_deck, deck_idx)
	    yeAddInt(cards_nb, -1)
	    tot_cards--;
	    yeCreateCopy(yeGet(cards, cname), p_deck, cname)
	}
    }
    return p
}

function paw_init(paw)
{
    yeCreateFunction(paw_action, paw, "action")
    yeCreateString("rgba: 255 255 255 255", paw, "background")
    var cards = ygFileToEnt(YJSON, "./cards.json")
    yePushBack(paw, cards, "cards")
    var deck = ygFileToEnt(YJSON, "./greek_deck.json")

    print("cards:\n", yent_to_str(cards))
    ret = ywidNewWidget(paw, "canvas")
    for (i = 0; i < yeLen(cards); ++i) {
	let img_path = yeGetKeyAt(cards, i) + ".png"
	mk_card(yeGet(cards, i), yeGetKeyAt(cards, i))
	var img = null
	var imgt = yeGet(yeGet(cards, i), "texture")

	//img = ywCanvasNewImgFromTexture(paw, 10, i * 110, imgt, null)
	//ywCanvasForceSize(img, sz)


    }
    var wid_size = yeGet(paw, "wid-pix")
    var wid_h = ywRectH(wid_size)
    var wid_w = ywRectW(wid_size)
    let back = mk_card_back()
    var sz = ywSizeCreate(CARD_W / 2, CARD_H / 2)

    yeCreateInt(0, paw, "turn")
    yeCreateInt(0, paw, "phase")

    var p = create_player(paw, "p1", deck)

    var back_c = ywCanvasNewImgFromTexture(paw, 100, 0, back, null)
    ywCanvasForceSize(back_c, sz)
    ywCanvasRotate(back_c, 180)
    yePushBack(p, back_c, "deck_c")

    p = create_player(paw, "p0", deck)

    back_c = ywCanvasNewImgFromTexture(paw, wid_w - 200,
				       wid_h - CARD_H / 2, back, null)
    ywCanvasForceSize(back_c, sz)
    yePushBack(p, back_c, "deck_c")

    return ret;
}

function mod_init(mod)
{
    var paw = yeCreateArray()

    yeCreateFunction(paw_init, paw, "callback")
    yeCreateString("polis-at-war", paw, "name")
    yeIncrRef(paw)
    ywidAddSubType(paw)

    var sw = yeCreateArray(mod, "starting widget")
    yeCreateString("polis-at-war", sw, "<type>")

    return mod
}
