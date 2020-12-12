let CARD_W = 200
let CARD_H = 300

function paw_action(paw, eves)
{
    print("action")
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

function paw_init(paw)
{
    yeCreateFunction(paw_action, paw, "action")
    yeCreateString("rgba: 255 255 255 255", paw, "background")
    var cards = ygFileToEnt(YJSON, "./cards.json")
    yePushBack(paw, cards, "cards")
    print("cards:\n", yent_to_str(cards))
    ret = ywidNewWidget(paw, "canvas")
    for (i = 0; i < yeLen(cards); ++i) {
	let img_path = yeGetKeyAt(cards, i) + ".png"
	var imgt = mk_card(yeGet(cards, i), yeGetKeyAt(cards, i))
	var img = null

	if (i < 4)
	    img = ywCanvasNewImgFromTexture(paw, 10, i * 110, imgt, null)
	else
	    img = ywCanvasNewImgFromTexture(paw, 120, (i - 4) * 110, imgt, null)

	var sz = ywSizeCreate(100 / 2, 160 / 2)

	let back = mk_card_back()
	ywCanvasNewImgFromTexture(paw, 170, 0, back, null)
	print("force size: ", ywCanvasForceSize(img, sz))
 	print(img_path)
	print(yent_to_str(img), yent_to_str(sz))
    }

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
