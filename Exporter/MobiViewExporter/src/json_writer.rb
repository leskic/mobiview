# encoding: UTF-8

require "json"
require "base64"
require "tmpdir"

module MobiViewExporter

  module JsonWriter

    extend self

    VERSION = "3.6.0"

    ############################################################
    # EXPORTAÇÃO
    ############################################################

    def save(model, pieces)

      file = UI.savepanel(

        "Salvar Projeto",

        "",

        "#{safe_name(model.title)}.json"

      )

      return unless file

      data = build_project(model, pieces)

      File.open(file, "w:utf-8") do |f|

        f.write(

          JSON.pretty_generate(data)

        )

      end

      UI.messagebox(

        "#{pieces.size} peças exportadas."

      )

    end

    ############################################################
    # PROJETO
    ############################################################

    def build_project(model, pieces)

      {

        format: "mobiview",

        version: VERSION,

        exporter: {

          name: "MobiView Exporter",

          version: VERSION

        },

        project: {

          name: model.title,

          guid: model.guid,

          path: model.path,

          exported_at: Time.now.strftime("%Y-%m-%d %H:%M:%S")

        },

        statistics: {

          total_pieces: pieces.size

        },

        materials: build_materials(model),

        views: ViewsBuilder.build(model, pieces),

        pieces: pieces.map { |piece|

          simplify_piece(piece)

        }

      }

    end

    ############################################################
    # MATERIAIS E TEXTURAS
    ############################################################

    def build_materials(model)

      model.materials.map do |material|

        color = material.color

        {
          id: material.name.to_s,
          name: material.display_name.to_s,
          color: format("#%02x%02x%02x", color.red, color.green, color.blue),
          alpha: material.alpha.to_f.round(4),
          texture: texture_data(material, model)
        }

      end

    rescue => e

      puts "ERRO AO EXPORTAR MATERIAIS: #{e.message}"
      []

    end

    def texture_data(material, model)

      texture = material.texture
      return nil unless texture

      filename = texture.filename.to_s
      bytes = nil
      mime = "image/png"

      if !filename.empty? && File.file?(filename)
        bytes = File.binread(filename)
        extension = File.extname(filename).downcase
        mime = case extension
        when ".jpg", ".jpeg" then "image/jpeg"
        when ".webp" then "image/webp"
        when ".bmp" then "image/bmp"
        else "image/png"
        end
      else
        bytes = extract_embedded_texture(model, material)
      end

      return nil unless bytes && !bytes.empty?

      {
        mime: mime,
        data: "data:#{mime};base64,#{Base64.strict_encode64(bytes)}",
        width_mm: texture.width.to_mm.round(3),
        height_mm: texture.height.to_mm.round(3)
      }

    rescue => e

      puts "TEXTURA NÃO EXPORTADA (#{material.name}): #{e.message}"
      nil

    end

    def extract_embedded_texture(model, material)

      target = find_material_entity(model.entities, material, {})
      return nil unless target

      entity = target[:entity]
      side = target[:side]
      writer = Sketchup.create_texture_writer
      temporary = File.join(
        Dir.tmpdir,
        "mobiview_texture_#{material.object_id}_#{Time.now.to_i}.png"
      )

      if side.nil?
        writer.load(entity)
        status = writer.write(entity, temporary)
      else
        writer.load(entity, side)
        status = writer.write(entity, side, temporary)
      end

      return nil unless status == 0 && File.file?(temporary)

      File.binread(temporary)

    rescue => e

      puts "TEXTURA INCORPORADA NÃO EXTRAÍDA (#{material.name}): #{e.message}"
      nil

    ensure

      begin
        File.delete(temporary) if temporary && File.file?(temporary)
      rescue
      end

    end

    def find_material_entity(entities, material, visited)

      entities.each do |entity|

        next if entity.deleted?

        if entity.is_a?(Sketchup::Face)
          return { entity: entity, side: true } if entity.material == material
          return { entity: entity, side: false } if entity.back_material == material
          next
        end

        if entity.is_a?(Sketchup::Group)
          return { entity: entity, side: nil } if entity.material == material
          result = find_material_entity(entity.entities, material, visited)
          return result if result
          next
        end

        next unless entity.is_a?(Sketchup::ComponentInstance)

        return { entity: entity, side: nil } if entity.material == material

        definition = entity.definition
        key = definition.object_id
        next if visited[key]

        visited[key] = true
        result = find_material_entity(definition.entities, material, visited)
        return result if result

      end

      nil

    end

    ############################################################
    # PEÇA
    ############################################################

    def simplify_piece(piece)

      {

        id: piece[:mv_uuid],

        persistent_id: piece[:persistent_id],

        code: piece[:code],

        name: piece[:name],

        module_id: piece[:module_id],

        material: piece[:material],

        ########################################################

        geometry: piece[:geometry],

        technical: piece[:technical],

        transform: piece[:transform],

        sketchup: piece[:sketchup],

        dinabox: piece[:dinabox],

        dynamic_attributes: piece[:dynamic_attributes]

      }

    end

    ############################################################
    # NOME
    ############################################################

    def safe_name(name)

      return "Projeto" if name.nil?

      text = name.strip

      return "Projeto" if text.empty?

      text.gsub(/[\\\/:*?"<>|]/, "_")

    end

  end

end
